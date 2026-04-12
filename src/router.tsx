import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Configuracoes from './pages/Configuracoes';
import Usuarios from './pages/Usuarios';
import Autorizacao from './pages/Autorizacao';

import ControleFabricacao from './pages/fabrica/ControleFabricacao';
import HistoricoProducao from './pages/fabrica/HistoricoProducao';
import EstoquePecas from './pages/fabrica/EstoquePecas';
import CarregamentoFabrica from './pages/fabrica/CarregamentoFabrica';

import VisaoGeralObra from './pages/obra/VisaoGeralObra';
import SolicitacaoFabricacao from './pages/obra/SolicitacaoFabricacao';
import SolicitacaoOrcamentoObra from './pages/obra/SolicitacaoOrcamentoObra';
import CarregamentoObra from './pages/obra/CarregamentoObra';
import PaineisMontados from './pages/obra/PaineisMontados';
import HistoricoMontagem from './pages/obra/HistoricoMontagem';

import SolicitacoesCentral from './pages/compras/SolicitacoesCentral';
import StatusCompras from './pages/compras/StatusCompras';
import EstoqueMateriais from './pages/compras/EstoqueMateriais';
import Cadastramento from './pages/compras/Cadastramento';
import HistoricoConsumo from './pages/compras/HistoricoConsumo';
import RastreioFerramentas from './pages/compras/RastreioFerramentas';

import FinanceiroGeral from './pages/financeiro/VisaoGeral';
import ContasPagar from './pages/financeiro/ContasPagar';
import ContasPagas from './pages/financeiro/ContasPagas';
import CadastroBancario from './pages/financeiro/CadastroBancario';

import CadastroFuncionario from './pages/rh/CadastroFuncionario';
import ListaFuncionarios from './pages/rh/ListaFuncionarios';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'configuracoes', element: <Configuracoes /> },
      { path: 'autorizacao', element: <Autorizacao /> },
      { path: 'usuarios', element: <Usuarios /> },

      // Fábrica
      { path: 'fabrica/controle', element: <ControleFabricacao /> },
      { path: 'fabrica/historico', element: <HistoricoProducao /> },
      { path: 'fabrica/estoque', element: <EstoquePecas /> },
      { path: 'fabrica/carregamento', element: <CarregamentoFabrica /> },

      // Obra
      { path: 'obra/visao-geral', element: <VisaoGeralObra /> },
      { path: 'obra/fabricacao', element: <SolicitacaoFabricacao /> },
      { path: 'obra/orcamento', element: <SolicitacaoOrcamentoObra /> },
      { path: 'obra/carregamento', element: <CarregamentoObra /> },
      { path: 'obra/paineis-montados', element: <PaineisMontados /> },
      { path: 'obra/historico-montagem', element: <HistoricoMontagem /> },

      // Compras
      { path: 'compras/solicitacoes', element: <SolicitacoesCentral /> },
      { path: 'compras/status', element: <StatusCompras /> },
      { path: 'compras/estoque', element: <EstoqueMateriais /> },
      { path: 'compras/cadastramento', element: <Cadastramento /> },
      { path: 'compras/historico-consumo', element: <HistoricoConsumo /> },
      { path: 'compras/ferramentas', element: <RastreioFerramentas /> },

      // Financeiro
      { path: 'financeiro/geral', element: <FinanceiroGeral /> },
      { path: 'financeiro/contas-pagar', element: <ContasPagar /> },
      { path: 'financeiro/contas-pagas', element: <ContasPagas /> },
      { path: 'financeiro/bancos', element: <CadastroBancario /> },

      // RH
      { path: 'rh/cadastro', element: <CadastroFuncionario /> },
      { path: 'rh/lista', element: <ListaFuncionarios /> },
    ],
  },
]);
