import driver from '../config/neo4j';

interface Description {
  lang: string;
  value: string;
}

const BASE_URL_NVD = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

function formatDateISO(date: Date): string {
  return encodeURIComponent(date.toISOString());
}

function extractVendorFromCpe(cpe: string): string {
  // Simple CPE parsing to extract vendor (part after "cpe:2.3:" and before next colon)
  // Example: cpe:2.3:a:microsoft:office:16.0:*:*:*:*:*:*:*
  const parts = cpe.split(':');
  return parts.length > 4 ? parts[4] : '';
}

export async function fetchNVDModified() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const start = formatDateISO(yesterday);
  const end = formatDateISO(now);
  const url = `${BASE_URL_NVD}?lastModStartDate=${start}&lastModEndDate=${end}`;

  const res = await fetch(url);
  const json = await res.json();

  const vulns = json.vulnerabilities ?? [];
  console.log(`Fetched ${vulns.length} vulnerabilities.`);

  for (const item of vulns) {
    const cve = item.cve;
    const id = cve.id;
    const description: string = cve.descriptions?.find((d: Description) => d.lang === 'en')?.value || '';

    // CVSS Score - Fixed to handle both v3.1 and v2.0 properly
    const cvssMetricV31 = cve.metrics?.cvssMetricV31?.[0];
    const cvssMetricV2 = cve.metrics?.cvssMetricV2?.[0];
    
    const cvssScore = cvssMetricV31?.cvssData?.baseScore ?? cvssMetricV2?.cvssData?.baseScore ?? null;
    const baseSeverity = cvssMetricV31?.baseSeverity ?? cvssMetricV2?.baseSeverity ?? null;
    const vectorString = cvssMetricV31?.cvssData?.vectorString ?? cvssMetricV2?.cvssData?.vectorString ?? null;
    const version = cvssMetricV31 ? '3.1' : (cvssMetricV2 ? '2.0' : null);

    // References
    const references: string[] = cve.references?.map((ref: { url: string }) => ref.url).filter(Boolean) ?? [];

    // Weaknesses as possible mitigations
    interface Weakness {
      description?: Description[];
    }

    const mitigations: string[] = cve.weaknesses?.flatMap((w: Weakness) =>
      w.description?.filter((d: Description) => d.lang === 'en').map((d: Description) => d.value)
    ).filter(Boolean) ?? [];

    // Affected component (CPE name)
    interface Configuration {
      nodes?: Node[];
    }

    interface Node {
      cpeMatch?: CpeMatch[];
    }

    interface CpeMatch {
      criteria: string;
    }

    const cpes: string[] = cve.configurations?.flatMap((cfg: Configuration) =>
      cfg.nodes?.flatMap((n: Node) => n.cpeMatch?.map((c: CpeMatch) => c.criteria)) ?? []
    ).filter(Boolean) ?? [];

    await saveToGraph({ 
      id, 
      description, 
      cvssScore, 
      baseSeverity, 
      vectorString,
      version,
      references, 
      mitigations, 
      cpes 
    });
  }

  console.log('Finished ingesting CVEs.');
}

async function saveToGraph({
  id,
  description,
  cvssScore,
  baseSeverity,
  vectorString,
  version,
  references,
  mitigations,
  cpes
}: {
  id: string;
  description: string;
  cvssScore: number | null;
  baseSeverity: string | null;
  vectorString: string | null;
  version: string | null;
  references: string[];
  mitigations: string[];
  cpes: string[];
}) {
  const session = driver.session();

  try {
    await session.writeTransaction(async tx => {
      // Create or update vulnerability node
      await tx.run(`
        MERGE (v:Vulnerability {cve_id: $id})
        ON CREATE SET 
          v.description = $description, 
          v.first_seen = datetime(),
          v.created = datetime()
        ON MATCH SET 
          v.description = $description, 
          v.last_updated = datetime()
      `, { id, description });

      // CVSS score node with proper attributes
      if (cvssScore !== null && version) {
        await tx.run(`
          MATCH (v:Vulnerability {cve_id: $id})
          MERGE (cvss:CVSS {
            score: $cvssScore, 
            version: $version
          })
          ON CREATE SET 
            cvss.vector_string = $vectorString,
            cvss.created = datetime()
          ON MATCH SET 
            cvss.vector_string = $vectorString,
            cvss.updated = datetime()
          MERGE (v)-[:HAS_CVSS_SCORE]->(cvss)
        `, { id, cvssScore, version, vectorString });
      }

      // Severity node
      if (baseSeverity) {
        await tx.run(`
          MATCH (v:Vulnerability {cve_id: $id})
          MERGE (s:Severity {level: $baseSeverity})
          MERGE (v)-[:HAS_BASE_SEVERITY]->(s)
        `, { id, baseSeverity });
      }

      // References
      for (const url of references) {
        await tx.run(`
          MATCH (v:Vulnerability {cve_id: $id})
          MERGE (r:Reference {url: $url})
          MERGE (v)-[:HAS_REFERENCE]->(r)
        `, { id, url });
      }

      // Mitigations (weakness descriptions)
      for (const mitigation of mitigations) {
        await tx.run(`
          MATCH (v:Vulnerability {cve_id: $id})
          MERGE (m:Mitigation {description: $mitigation})
          MERGE (v)-[:HAS_MITIGATION]->(m)
        `, { id, mitigation });
      }

      // Components and Vendors
      for (const cpe of cpes) {
        const vendor = extractVendorFromCpe(cpe);

        // Create component and link to vulnerability
        await tx.run(`
          MATCH (v:Vulnerability {cve_id: $id})
          MERGE (c:Component {cpe: $cpe})
          MERGE (v)-[:AFFECTS_COMPONENT]->(c)
        `, { id, cpe });

        // Create vendor and link to component
        if (vendor) {
          await tx.run(`
            MATCH (c:Component {cpe: $cpe})
            MERGE (vend:Vendor {name: $vendor})
            MERGE (c)-[:FROM_VENDOR]->(vend)
          `, { vendor, cpe });
        }
      }

      // Create similarity relationships based on CVSS score ranges
      if (cvssScore !== null) {
        await tx.run(`
          MATCH (v1:Vulnerability {cve_id: $id})
          MATCH (v2:Vulnerability)
          WHERE v1 <> v2 
            AND EXISTS((v1)-[:HAS_CVSS_SCORE]->(:CVSS))
            AND EXISTS((v2)-[:HAS_CVSS_SCORE]->(:CVSS))
          WITH v1, v2,
               [(v1)-[:HAS_CVSS_SCORE]->(cvss1:CVSS) | cvss1.score][0] as score1,
               [(v2)-[:HAS_CVSS_SCORE]->(cvss2:CVSS) | cvss2.score][0] as score2
          WHERE abs(score1 - score2) <= 1.0
          MERGE (v1)-[sim:SIMILAR_SEVERITY]-(v2)
          ON CREATE SET sim.score_difference = abs(score1 - score2)
        `, { id });
      }

      // Create similarity relationships based on affected vendors
      if (cpes.length > 0) {
        await tx.run(`
          MATCH (v1:Vulnerability {cve_id: $id})
          MATCH (v2:Vulnerability)
          WHERE v1 <> v2
          WITH v1, v2,
               [(v1)-[:AFFECTS_COMPONENT]->(:Component)-[:FROM_VENDOR]->(vendor:Vendor) | vendor.name] as vendors1,
               [(v2)-[:AFFECTS_COMPONENT]->(:Component)-[:FROM_VENDOR]->(vendor:Vendor) | vendor.name] as vendors2
          WHERE size(vendors1) > 0 AND size(vendors2) > 0
            AND any(vendor IN vendors1 WHERE vendor IN vendors2)
          MERGE (v1)-[sim:SIMILAR_VENDOR]-(v2)
          ON CREATE SET sim.common_vendors = [vendor IN vendors1 WHERE vendor IN vendors2]
        `, { id });
      }
    });

  } catch (err) {
    console.error(`Error saving CVE ${id}:`, err);
  } finally {
    await session.close();
  }
}

(async () => {
  try {
    await fetchNVDModified();
    console.log('CVE ingestion completed successfully.');
  } catch (error) {
    console.error('Error during CVE ingestion:', error);
  } finally {
    await driver.close();
  }
})();