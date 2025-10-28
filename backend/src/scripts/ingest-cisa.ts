import driver from '../config/neo4j';

export async function fetchCISA() {
  const url = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  const res = await fetch(url);
  const data = await res.json();

  const vulns = data.vulnerabilities ?? [];
  console.log(`Fetched ${vulns.length} vulnerabilities from CISA.`);

  for (const vuln of vulns) {
    const cveId = vuln.cveID;
    const shortDescription = vuln.shortDescription || '';
    const mitigation = vuln.requiredAction || '';
    const dueDate = vuln.dueDate || null;
    const dateAdded = vuln.dateAdded || null;
    const references: string[] = (vuln.notes ?? '').match(/https?:\/\/\S+/g) || [];
    const product = vuln.product || '';
    const vendor = vuln.vendorProject || '';
    const cwes: string[] = vuln.cwes ?? [];

    await updateGraphWithCISAMitigation({
      cveId,
      mitigation,
      shortDescription,
      dueDate,
      dateAdded,
      references,
      product,
      vendor,
      cwes
    });
  }

  console.log('CISA KEV ingestion done.');
}

async function updateGraphWithCISAMitigation({
  cveId,
  mitigation,
  shortDescription,
  dueDate,
  dateAdded,
  references,
  product,
  vendor,
  cwes
}: {
  cveId: string;
  mitigation: string;
  shortDescription: string;
  dueDate: string | null;
  dateAdded: string | null;
  references: string[];
  product: string;
  vendor: string;
  cwes: string[];
}) {
  const session = driver.session();

  try {
    await session.writeTransaction(async tx => {
      // Vulnerability node
      await tx.run(`
        MERGE (v:Vulnerability {cve_id: $cveId})
        SET v.short_description = $shortDescription,
            v.due_date = CASE WHEN $dueDate IS NOT NULL THEN date($dueDate) ELSE NULL END,
            v.date_added = CASE WHEN $dateAdded IS NOT NULL THEN date($dateAdded) ELSE NULL END,
            v.last_updated = datetime()
      `, { cveId, shortDescription, dueDate, dateAdded });

      // Mitigation node and relationship
      await tx.run(`
        MERGE (m:Mitigation {description: $mitigation, source: 'CISA'})
        SET m.short_description = $shortDescription
        MERGE (v:Vulnerability {cve_id: $cveId})
        MERGE (v)-[:HAS_MITIGATION]->(m)
      `, { cveId, mitigation, shortDescription });

      // Component node and relationship
      if (product !== '') {
        await tx.run(`
          MERGE (comp:Component {name: $product})
          MERGE (v:Vulnerability {cve_id: $cveId})
          MERGE (v)-[:AFFECTS_COMPONENT]->(comp)
        `, { cveId, product });
      }

      // Vendor node and relationship
      if (vendor !== '') {
        await tx.run(`
          MERGE (vend:Vendor {name: $vendor})
          MERGE (comp:Component {name: $product})
          MERGE (comp)-[:FROM_VENDOR]->(vend)
        `, { vendor, product });
      }

      // CWE nodes and relationships
      for (const cwe of cwes) {
        await tx.run(`
          MERGE (c:CWE {id: $cwe})
          MERGE (v:Vulnerability {cve_id: $cveId})
          MERGE (v)-[:HAS_CWE]->(c)
        `, { cwe, cveId });
      }

      // Reference nodes and relationships
      for (const url of references) {
        await tx.run(`
          MERGE (r:Reference {url: $url})
          MERGE (v:Vulnerability {cve_id: $cveId})
          MERGE (v)-[:HAS_REFERENCE]->(r)
        `, { cveId, url });
      }
    });
  } catch (err) {
    console.error(`Failed to ingest CISA data for ${cveId}:`, err);
  } finally {
    await session.close();
  }
}

(async () => {
  await fetchCISA();
  await driver.close();
})();
