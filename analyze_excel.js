const XLSX = require('xlsx');

// Ler a planilha
try {
  const workbook = XLSX.readFile('/Users/paulo/Projeto/dados site/wordpess/vendas12.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('=== ESTRUTURA DA PLANILHA ===');
  console.log(`Total de linhas: ${data.length}`);
  
  if (data.length > 0) {
    console.log('Colunas:', Object.keys(data[0]));
    console.log('\n=== PRIMEIRAS 5 LINHAS ===');
    console.log(data.slice(0, 5));
    
    // Procurar colunas com valores monetários
    console.log('\n=== ANÁLISE DE COLUNAS ===');
    const firstRow = data[0];
    Object.keys(firstRow).forEach(col => {
      const values = data.map(row => row[col]).filter(val => val != null);
      const numericValues = values.filter(val => typeof val === 'number');
      
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        console.log(`${col}: ${numericValues.length} valores numéricos, Soma: ${sum}`);
      }
    });
    
    // Calcular total geral
    let totalGeral = 0;
    data.forEach(row => {
      Object.values(row).forEach(val => {
        if (typeof val === 'number' && val > 0) {
          totalGeral += val;
        }
      });
    });
    
    console.log(`\n=== TOTAL GERAL ===`);
    console.log(`Total geral dos valores: R$ ${totalGeral.toFixed(2)}`);
  }
  
} catch (error) {
  console.error('Erro ao ler planilha:', error);
}