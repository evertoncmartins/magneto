
import React, { useEffect } from 'react';
import { 
    Shield, FileText, Truck, RefreshCw, Lock, 
    AlertTriangle, CheckCircle, Clock, Info, Package, AlertCircle, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LegalLayout: React.FC<{ title: string; subtitle: string; icon: any; children: React.ReactNode }> = ({ title, subtitle, icon: Icon, children }) => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    
    return (
        <div className="min-h-screen bg-white">
            {/* Cabeçalho Preto Sólido */}
            <div className="bg-[#1d1d1f] w-full pt-36 pb-20 md:pt-48 md:pb-24 flex flex-col items-center justify-center text-center px-6">
                <div className="animate-fade-in max-w-4xl mx-auto">
                    <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full border border-white/10 bg-white/5 text-[#B8860B]">
                        <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className="block text-[#B8860B] font-bold text-xs uppercase tracking-[0.4em] mb-4">{subtitle}</span>
                    <h1 className="text-3xl md:text-5xl font-serif text-white font-medium leading-tight">{title}</h1>
                </div>
            </div>

            {/* Conteúdo - Direto na página */}
            <div className="max-w-[900px] mx-auto px-6 py-16">
                <div className="animate-fade-in">
                    <div className="prose prose-lg max-w-none text-[#1d1d1f] prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#1d1d1f] prose-p:text-[#6e6e73] prose-p:font-light prose-p:leading-loose prose-li:text-[#6e6e73] prose-strong:text-[#1d1d1f] prose-strong:font-bold">
                        {children}
                    </div>
                </div>
            </div>

            {/* Seção de Fechamento / Dúvidas */}
            <div className="bg-[#1d1d1f] py-24 text-center border-t border-gray-800">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Restou alguma dúvida?</h2>
                    <p className="text-white/60 font-light text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                        A transparência é a base da nossa relação. Se precisar de esclarecimentos sobre qualquer ponto, nossa equipe está à disposição.
                    </p>
                    <Link 
                        to="/contact"
                        className="inline-flex items-center gap-3 px-10 py-4 bg-[#B8860B] text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-[#966d09] transition-all shadow-lg hover:-translate-y-1"
                    >
                        Fale Conosco <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Box de Destaque com Ícone (Estilo Solicitado)
const HighlightBox = ({ icon: Icon, title, children }: { icon?: any, title?: string, children: React.ReactNode }) => (
    <div className="bg-[#FFF9E6] border-l-4 border-[#B8860B] p-6 my-10 rounded-r-lg flex flex-col md:flex-row gap-5 items-start shadow-sm">
        {Icon && (
            <div className="shrink-0 text-[#B8860B] bg-white/60 p-2 rounded-full mt-1">
                <Icon size={24} />
            </div>
        )}
        <div className="flex-1">
            {title && <h4 className="text-[#856404] font-bold text-xs uppercase tracking-widest mb-2">{title}</h4>}
            <div className="text-[#856404] text-sm font-medium m-0 leading-relaxed">
                {children}
            </div>
        </div>
    </div>
);

// Bloco Informativo Diagramado (Estilo imagem FSC)
const InfoBlock = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
    <div className="flex gap-5 items-start p-4 not-prose">
        <div className="text-[#B8860B] shrink-0 mt-1">
            <Icon size={28} strokeWidth={1.5} />
        </div>
        <div>
            <h4 className="font-bold text-[#1d1d1f] text-xs uppercase tracking-widest mb-2">{title}</h4>
            <p className="text-sm text-[#6e6e73] leading-relaxed font-light m-0">{children}</p>
        </div>
    </div>
);

export const PrivacyPolicy = () => (
    <LegalLayout title="Política de Privacidade" subtitle="Lei Geral de Proteção de Dados (LGPD)" icon={Lock}>
        
        <HighlightBox icon={Shield}>
            A Magneto valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações, em total conformidade com a Lei nº 13.709/2018.
        </HighlightBox>
        
        <h3 className="text-2xl mt-12 mb-6">1. Coleta de Dados</h3>
        <p>Coletamos apenas os dados estritamente necessários para a prestação dos nossos serviços de personalização e entrega de produtos, incluindo: Nome completo, CPF (para emissão de Nota Fiscal), endereço de entrega, e-mail, telefone e as imagens enviadas para personalização.</p>

        <h3 className="text-2xl mt-12 mb-6">2. Uso das Imagens</h3>
        <p>As imagens enviadas para a produção dos ímãs são tratadas com <strong>sigilo absoluto</strong>. Elas são armazenadas em nossos servidores criptografados apenas pelo tempo necessário para a produção e garantia de qualidade (até 90 dias após a entrega).</p>
        <p>Após este período, os arquivos originais são excluídos permanentemente de nossa base de dados. <strong>Não utilizamos suas fotos para fins publicitários sem o seu consentimento expresso e por escrito.</strong></p>

        <h3 className="text-2xl mt-12 mb-6">3. Compartilhamento de Dados</h3>
        <p>Não vendemos seus dados. O compartilhamento ocorre apenas com parceiros essenciais para a operação:</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-[#B8860B]">
            <li>Transportadoras (para entrega);</li>
            <li>Gateways de pagamento (para processamento financeiro seguro);</li>
            <li>Órgãos fiscais (para emissão de NF-e).</li>
        </ul>

        <h3 className="text-2xl mt-12 mb-6">4. Seus Direitos (LGPD)</h3>
        <p>Você tem direito a confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos ou desatualizados e solicitar a eliminação de dados pessoais, exceto aqueles que precisamos manter por obrigação legal.</p>
    </LegalLayout>
);

export const TermsOfUse = () => (
    <LegalLayout title="Termos de Uso" subtitle="Regras de Utilização" icon={FileText}>
        <p className="lead text-lg mb-12 text-[#1d1d1f] font-medium">Bem-vindo à Magneto. Ao utilizar nosso site e serviços, você concorda com os termos descritos abaixo, que regem a relação entre a plataforma e o usuário.</p>

        <h3 className="text-2xl mt-12 mb-6">1. Objeto</h3>
        <p>A Magneto é uma plataforma de e-commerce especializada na personalização e venda de ímãs fotográficos de alta qualidade ("Fine Art"), produzidos sob demanda.</p>

        <h3 className="text-2xl mt-12 mb-6">2. Responsabilidade pelo Conteúdo</h3>
        <p>O usuário declara ser o titular dos direitos autorais ou ter autorização para uso das imagens enviadas. A Magneto não se responsabiliza por violações de direitos autorais ou de imagem de terceiros contidos nas fotos submetidas pelo cliente.</p>
        
        <HighlightBox icon={AlertCircle} title="Conteúdo Proibido">
            Reservamo-nos o direito de recusar pedidos com conteúdo ilícito, pornográfico, que incite ao ódio ou viole a legislação brasileira vigente.
        </HighlightBox>

        <h3 className="text-2xl mt-12 mb-6">3. Variação de Cor e Impressão</h3>
        <p>Pode haver variação na tonalidade das cores entre a imagem visualizada em telas (padrão RGB, com luz própria) e o produto impresso (padrão CMYK, pigmento mineral). Variações sutis de calibração não são consideradas defeito de fabricação.</p>
    </LegalLayout>
);

export const ExchangePolicy = () => (
    <LegalLayout title="Política de Troca" subtitle="Código de Defesa do Consumidor" icon={RefreshCw}>
        
        <HighlightBox icon={Info} title="Atenção ao Consumidor">
            Produtos personalizados possuem regras específicas de troca e devolução, conforme entendimento do Código de Defesa do Consumidor (CDC).
        </HighlightBox>

        <h3 className="text-2xl mt-12 mb-6">1. Produtos Personalizados</h3>
        <p>Nossos produtos são feitos sob encomenda exclusivamente para você. Devido à natureza personalíssima, <strong>não aceitamos devoluções por arrependimento ou gosto pessoal</strong> (ex: "não gostei da foto que eu escolhi"), uma vez que o produto não pode ser revendido a terceiros.</p>
        <p>Esta exceção é amplamente reconhecida na jurisprudência brasileira para evitar prejuízos desproporcionais ao fornecedor de bens feitos sob medida.</p>

        <h3 className="text-2xl mt-12 mb-6">2. Defeitos de Fabricação</h3>
        <p>Caso o produto apresente defeito de impressão, corte incorreto ou avaria no transporte, garantimos a <strong>troca imediata ou reembolso integral</strong>, conforme Art. 18 do CDC.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 border-t border-b border-gray-100 py-8">
            <InfoBlock icon={Clock} title="Prazo Legal">
                O cliente tem até 90 dias corridos para reclamar de vícios aparentes ou de fácil constatação no produto recebido.
            </InfoBlock>
            <InfoBlock icon={CheckCircle} title="Procedimento">
                Envie fotos do defeito para contato@magneto.com. Faremos uma análise técnica em até 48 horas úteis.
            </InfoBlock>
        </div>

        <h3 className="text-2xl mt-12 mb-6">3. Erro no Endereço</h3>
        <p>Caso o pedido retorne devido a endereço incorreto fornecido pelo cliente no momento da compra, será cobrado um novo frete para o reenvio da mercadoria.</p>
    </LegalLayout>
);

export const ShippingPolicy = () => (
    <LegalLayout title="Envios & Prazos" subtitle="Logística e Entrega" icon={Truck}>
        <h3 className="text-2xl mt-12 mb-6">1. Prazo de Produção</h3>
        <p>Por ser um produto artesanal com acabamento manual rigoroso, nosso prazo de produção é de <strong>2 a 4 dias úteis</strong> após a confirmação do pagamento. Este tempo é necessário para a cura da impressão e secagem da laminação UV.</p>

        <h3 className="text-2xl mt-12 mb-6">2. Modalidades de Entrega</h3>
        <p>O prazo de entrega varia conforme a região e a modalidade escolhida. O prazo total informado no carrinho já soma o tempo de produção + tempo de transporte.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 border-t border-b border-gray-100 py-8">
            <InfoBlock icon={Truck} title="Correios SEDEX">
                Modalidade expressa recomendada para quem tem pressa. Entrega em capitais geralmente ocorre entre 1 a 3 dias úteis após a postagem.
            </InfoBlock>
            <InfoBlock icon={Package} title="Correios PAC">
                Modalidade econômica para envios não urgentes. O prazo é maior, porém o custo do frete é reduzido.
            </InfoBlock>
        </div>

        <h3 className="text-2xl mt-12 mb-6">3. Atrasos e Extravios</h3>
        <p>A Magneto monitora todos os envios. Em caso de extravio confirmado pela transportadora, faremos a reprodução e reenvio do pedido <strong>sem custo adicional</strong> e com prioridade na produção, ou o reembolso integral, conforme preferência do cliente.</p>
    </LegalLayout>
);
