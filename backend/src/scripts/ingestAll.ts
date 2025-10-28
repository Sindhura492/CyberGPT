import driver from '../config/neo4j';
import { fetchNVDModified } from './ingest-nvd';
import { fetchCISA } from './ingest-cisa';

async function runAllIngestions() {
  console.log('🚀 Starting full ingestion pipeline...\n');

  try {
    console.log('📥 Fetching & ingesting data from NVD...');
    await fetchNVDModified();
    console.log('✅ NVD ingestion complete.\n');
  } catch (err) {
    console.error('❌ Error during NVD ingestion:', err);
  }

  try {
    console.log('📥 Fetching & ingesting data from CISA...');
    await fetchCISA();
    console.log('✅ CISA ingestion complete.\n');
  } catch (err) {
    console.error('❌ Error during CISA ingestion:', err);
  }

  await driver.close();
  console.log('🔌 Neo4j connection closed.');
}

runAllIngestions();
