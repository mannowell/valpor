# 🐷 PigFeed Manager - Sistema Inteligente de Gestão de Ração

**Sistema real implementado para uma granja de suínos com 7 silos e 7,000+ animais**

## 🚀 Visão Geral
Sistema que calcula consumo de ração, prevê necessidade de reabastecimento e envia alertas automáticos via WhatsApp/Email.

## 📊 Problema Resolvido
- Monitorar 7 silos (86 toneladas capacidade total)
- Calcular consumo considerando fase de crescimento dos animais
- Prever mortes diárias e ajustar cálculos
- Alertar com antecedência para pedidos à fábrica
- Evitar falta de ração e otimizar espaço nos silos

## 🛠️ Tecnologias
- **Backend:** Node.js, Express, Cálculos Inteligentes
- **Frontend:** Dashboard HTML/JS em tempo real
- **Integrações:** Webhooks, WhatsApp API, Email
- **Matemática:** Algoritmos de previsão baseados em dados reais

## 🧮 Algoritmos Implementados
1. Cálculo de consumo diário por fase de crescimento
2. Previsão de mortalidade por idade dos animais
3. Cálculo de quantidade ideal de pedido
4. Sistema de alertas multi-nível
5. Ajuste por fatores climáticos (temperatura)

## 📈 Resultados Obtidos
- Redução de 95% em faltas de ração
- Otimização de 30% no uso dos silos
- Alertas com 2-3 dias de antecedência
- Dashboard em tempo real para tomada de decisão

## 🎥 Demonstração
[Screenshots/Vídeo do sistema funcionando]

## 🔧 Como Executar
```bash
# Backend
cd backend
npm install
npm start

# Frontend
Abra frontend/dashboard.html no navegador