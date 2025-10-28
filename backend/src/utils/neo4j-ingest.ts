import { driver } from '../config/neo4j';
import neo4j, { Session } from 'neo4j-driver';

const sampleData = [
  {
    vulnerability: {
      name: 'SQL Injection',
      description: 'A code injection technique that might destroy your database.',
      type: 'Injection',
      source: 'OWASP',
    },
    cves: [
      {
        cveId: 'CVE-2021-12345',
        description: 'SQL Injection in login form.',
        cvss: 9.8,
        severity: 'Critical',
        confidence: 0.95,
        source: 'NVD',
        mitigations: [
          {
            description: 'Use parameterized queries.',
            source: 'OWASP',
          },
          {
            description: 'Validate user input.',
            source: 'OWASP',
          },
        ],
      },
      {
        cveId: 'CVE-2022-54321',
        description: 'Blind SQL Injection in search endpoint.',
        cvss: 8.6,
        severity: 'High',
        confidence: 0.9,
        source: 'NVD',
        mitigations: [
          {
            description: 'Escape all user-supplied input.',
            source: 'OWASP',
          },
        ],
      },
    ],
  },
  {
    vulnerability: {
      name: 'Cross-Site Scripting',
      description: 'Allows attackers to inject client-side scripts into web pages.',
      type: 'Injection',
      source: 'OWASP',
    },
    cves: [
      {
        cveId: 'CVE-2020-11111',
        description: 'Reflected XSS in comment section.',
        cvss: 6.1,
        severity: 'Medium',
        confidence: 0.85,
        source: 'NVD',
        mitigations: [
          {
            description: 'Sanitize all user input.',
            source: 'OWASP',
          },
          {
            description: 'Implement Content Security Policy (CSP).',
            source: 'OWASP',
          },
        ],
      },
    ],
  },
];

async function setupConstraints(session: Session) {
  await session.run(
    'CREATE CONSTRAINT IF NOT EXISTS FOR (c:CVE) REQUIRE c.cveId IS UNIQUE'
  );
  await session.run(
    'CREATE CONSTRAINT IF NOT EXISTS FOR (v:Vulnerability) REQUIRE v.name IS UNIQUE'
  );
  await session.run(
    'CREATE CONSTRAINT IF NOT EXISTS FOR (m:Mitigation) REQUIRE m.description IS UNIQUE'
  );
  await session.run(
    'CREATE CONSTRAINT IF NOT EXISTS FOR (s:Source) REQUIRE s.name IS UNIQUE'
  );
}

async function ingestData() {
  const session = driver.session();
  try {
    await setupConstraints(session);
    for (const entry of sampleData) {
      // Create Vulnerability node
      await session.run(
        `MERGE (v:Vulnerability {name: $name})
         ON CREATE SET v.description = $description, v.type = $type
         WITH v
         MERGE (src:Source {name: $source})
         MERGE (v)-[:HAS_SOURCE]->(src)`,
        {
          name: entry.vulnerability.name,
          description: entry.vulnerability.description,
          type: entry.vulnerability.type,
          source: entry.vulnerability.source,
        }
      );
      for (const cve of entry.cves) {
        // Create CVE node
        await session.run(
          `MERGE (c:CVE {cveId: $cveId})
           ON CREATE SET c.description = $description, c.cvss = $cvss, c.severity = $severity, c.confidence = $confidence
           WITH c
           MERGE (src:Source {name: $source})
           MERGE (c)-[:HAS_SOURCE]->(src)`,
          {
            cveId: cve.cveId,
            description: cve.description,
            cvss: cve.cvss,
            severity: cve.severity,
            confidence: cve.confidence,
            source: cve.source,
          }
        );
        // Link Vulnerability to CVE
        await session.run(
          `MATCH (v:Vulnerability {name: $vulnName}), (c:CVE {cveId: $cveId})
           MERGE (v)-[:VULNERABILITY_HAS_CVE]->(c)`,
          {
            vulnName: entry.vulnerability.name,
            cveId: cve.cveId,
          }
        );
        // Create Risk node and link
        await session.run(
          `MERGE (r:Risk {level: $severity})
           ON CREATE SET r.cvss = $cvss
           MERGE (c:CVE {cveId: $cveId})
           MERGE (c)-[:CVE_HAS_RISK]->(r)`,
          {
            severity: cve.severity,
            cvss: cve.cvss,
            cveId: cve.cveId,
          }
        );
        // Create Mitigation nodes and link
        for (const mitigation of cve.mitigations) {
          await session.run(
            `MERGE (m:Mitigation {description: $description})
             WITH m
             MERGE (src:Source {name: $source})
             MERGE (m)-[:HAS_SOURCE]->(src)
             WITH m
             MATCH (c:CVE {cveId: $cveId})
             MERGE (c)-[:CVE_HAS_MITIGATION]->(m)`,
            {
              description: mitigation.description,
              source: mitigation.source,
              cveId: cve.cveId,
            }
          );
        }
      }
    }
    console.log('Sample cybersecurity data ingested into Neo4j!');
  } catch (err) {
    console.error('Error during ingestion:', err);
  } finally {
    await session.close();
    await driver.close();
  }
}

ingestData(); 