import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import { create } from '../../lib/storage';
import { STORAGE_KEYS, type FuncionarioRH } from '../../lib/types';

export default function CadastroFuncionario() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const [nome, setNome] = useState(''); const [sobrenome, setSobrenome] = useState('');
  const [apelido, setApelido] = useState(''); const [admissao, setAdmissao] = useState('');
  const [nacionalidade, setNacionalidade] = useState('Brasileira'); const [nascimento, setNascimento] = useState('');
  const [sexo, setSexo] = useState(''); const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState(''); const [pis, setPis] = useState('');
  const [email, setEmail] = useState(''); const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState(''); const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState(''); const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState(''); const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState(''); const [escolaridade, setEscolaridade] = useState('');
  const [ocupacao, setOcupacao] = useState(''); const [certificacoes, setCertificacoes] = useState('');

  const handleSave = () => {
    if (!nome.trim()) return;
    create<FuncionarioRH>(STORAGE_KEYS.FUNCIONARIOS_RH, {
      codigoInterno: `FUN-${Date.now()}`, nome, sobrenome, apelido, admissao,
      nacionalidade, nascimento, sexo, cpf, rg, pis, email, telefone,
      notificacao: 0, whatsapp: 0, cep, rua, bairro, numero, complemento, estado, cidade,
      escolaridade, cei: '', fornecedor: '', ocupacao, tiposDocumentos: '',
      certificacoes, foto: '', documentos: [],
    } as Omit<FuncionarioRH, 'id'>);
    setSaved(true);
    setTimeout(() => navigate('/rh/lista'), 1500);
  };

  const inputClass = "w-full bg-surface-container-low border border-border";
  const inputStyle = { padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' };

  if (saved) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: '120px' }}>
          <div className="bg-success rounded-full flex items-center justify-center" style={{ width: '64px', height: '64px', marginBottom: '20px' }}>
            <Check size={32} className="text-white" />
          </div>
          <h2 className="font-extrabold text-text-primary" style={{ fontSize: '24px' }}>Funcionario Cadastrado!</h2>
          <p className="text-text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>Redirecionando para a lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>RH</p>
      <div className="flex items-center gap-3">
        <UserPlus size={28} className="text-primary" />
        <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Cadastrar Funcionario</h1>
      </div>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Preencha os dados do novo funcionario</p>

      <div className="flex flex-col gap-6" style={{ marginTop: '32px' }}>
        {/* Dados Pessoais */}
        <div className="border border-border rounded-xl" style={{ padding: '24px' }}>
          <p className="font-extrabold text-text-primary uppercase tracking-wider" style={{ fontSize: '12px', marginBottom: '16px' }}>Dados Pessoais</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Nome</label><input type="text" value={nome} onChange={e => setNome(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Sobrenome</label><input type="text" value={sobrenome} onChange={e => setSobrenome(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Apelido</label><input type="text" value={apelido} onChange={e => setApelido(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Data Nascimento</label><input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Sexo</label><select value={sexo} onChange={e => setSexo(e.target.value)} className={inputClass} style={inputStyle}><option value="">Selecione</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option><option value="Outro">Outro</option></select></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Nacionalidade</label><input type="text" value={nacionalidade} onChange={e => setNacionalidade(e.target.value)} className={inputClass} style={inputStyle} /></div>
          </div>
        </div>

        {/* Documentos */}
        <div className="border border-border rounded-xl" style={{ padding: '24px' }}>
          <p className="font-extrabold text-text-primary uppercase tracking-wider" style={{ fontSize: '12px', marginBottom: '16px' }}>Documentos</p>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>CPF</label><input type="text" value={cpf} onChange={e => setCpf(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>RG</label><input type="text" value={rg} onChange={e => setRg(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>PIS</label><input type="text" value={pis} onChange={e => setPis(e.target.value)} className={inputClass} style={inputStyle} /></div>
          </div>
        </div>

        {/* Contato */}
        <div className="border border-border rounded-xl" style={{ padding: '24px' }}>
          <p className="font-extrabold text-text-primary uppercase tracking-wider" style={{ fontSize: '12px', marginBottom: '16px' }}>Contato</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Telefone</label><input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className={inputClass} style={inputStyle} /></div>
          </div>
        </div>

        {/* Endereco */}
        <div className="border border-border rounded-xl" style={{ padding: '24px' }}>
          <p className="font-extrabold text-text-primary uppercase tracking-wider" style={{ fontSize: '12px', marginBottom: '16px' }}>Endereco</p>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>CEP</label><input type="text" value={cep} onChange={e => setCep(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div className="col-span-2"><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Rua</label><input type="text" value={rua} onChange={e => setRua(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Numero</label><input type="text" value={numero} onChange={e => setNumero(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Bairro</label><input type="text" value={bairro} onChange={e => setBairro(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Complemento</label><input type="text" value={complemento} onChange={e => setComplemento(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Cidade</label><input type="text" value={cidade} onChange={e => setCidade(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Estado</label><input type="text" value={estado} onChange={e => setEstado(e.target.value)} className={inputClass} style={inputStyle} /></div>
          </div>
        </div>

        {/* Profissional */}
        <div className="border border-border rounded-xl" style={{ padding: '24px' }}>
          <p className="font-extrabold text-text-primary uppercase tracking-wider" style={{ fontSize: '12px', marginBottom: '16px' }}>Dados Profissionais</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Data Admissao</label><input type="date" value={admissao} onChange={e => setAdmissao(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Ocupacao</label><input type="text" value={ocupacao} onChange={e => setOcupacao(e.target.value)} className={inputClass} style={inputStyle} /></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Escolaridade</label><select value={escolaridade} onChange={e => setEscolaridade(e.target.value)} className={inputClass} style={inputStyle}><option value="">Selecione</option><option value="Fundamental">Fundamental</option><option value="Medio">Medio</option><option value="Superior">Superior</option><option value="Pos-graduacao">Pos-graduacao</option></select></div>
            <div><label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Certificacoes</label><input type="text" value={certificacoes} onChange={e => setCertificacoes(e.target.value)} placeholder="Ex: NR10, NR35" className={inputClass} style={inputStyle} /></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3" style={{ marginTop: '32px', paddingBottom: '40px' }}>
        <button onClick={() => navigate('/rh/lista')} className="text-text-secondary font-bold" style={{ padding: '14px 28px', borderRadius: '10px', fontSize: '14px' }}>Cancelar</button>
        <button onClick={handleSave} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '14px 28px', borderRadius: '10px', fontSize: '14px' }}>Cadastrar Funcionario</button>
      </div>
    </div>
  );
}
