console.log('🐷 Inicializando dados do PigFeed Manager...');

const silos = [
  { id: 1, numero: 1, capacidade_ton: 12, capacidade_kg: 12000, racao_atual_kg: 8500, tipo_racao: 'inicial', ativo: true },
  { id: 2, numero: 2, capacidade_ton: 10, capacidade_kg: 10000, racao_atual_kg: 7000, tipo_racao: 'crescimento1', ativo: true },
  { id: 3, numero: 3, capacidade_ton: 10, capacidade_kg: 10000, racao_atual_kg: 8000, tipo_racao: 'crescimento2', ativo: true },
  { id: 4, numero: 4, capacidade_ton: 10, capacidade_kg: 10000, racao_atual_kg: 6000, tipo_racao: 'finalizacao', ativo: true },
  { id: 5, numero: 5, capacidade_ton: 12, capacidade_kg: 12000, racao_atual_kg: 11000, tipo_racao: 'inicial', ativo: true },
  { id: 6, numero: 6, capacidade_ton: 12, capacidade_kg: 12000, racao_atual_kg: 9000, tipo_racao: 'crescimento1', ativo: true },
  { id: 7, numero: 7, capacidade_ton: 10, capacidade_kg: 10000, racao_atual_kg: 7500, tipo_racao: 'crescimento2', ativo: true }
];

const lotes = [
  { id: 'LOTE-001', silo_id: 1, quantidade_inicial: 1000, quantidade_atual: 980, fase_crescimento: 'inicial', data_entrada: '2024-01-01' },
  { id: 'LOTE-002', silo_id: 2, quantidade_inicial: 950, quantidade_atual: 940, fase_crescimento: 'crescimento1', data_entrada: '2024-01-15' },
  { id: 'LOTE-003', silo_id: 3, quantidade_inicial: 900, quantidade_atual: 890, fase_crescimento: 'crescimento2', data_entrada: '2024-02-01' },
  { id: 'LOTE-004', silo_id: 4, quantidade_inicial: 850, quantidade_atual: 845, fase_crescimento: 'finalizacao', data_entrada: '2024-02-15' }
];

console.log('✅ Dados inicializados:');
console.log(`   ${silos.length} silos criados`);
console.log(`   ${lotes.length} lotes criados`);
console.log('\n📊 Resumo dos silos:');
silos.forEach(silo => {
  console.log(`   Silo ${silo.numero}: ${silo.racao_atual_kg}kg/${silo.capacidade_kg}kg (${((silo.racao_atual_kg/silo.capacidade_kg)*100).toFixed(1)}%)`);
});