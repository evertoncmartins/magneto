
import React, { useEffect } from 'react';
import { Shield, FileText, Truck, RefreshCw, Lock } from 'lucide-react';

const LegalLayout: React.FC<{ title: string; subtitle: string; icon: any; children: React.ReactNode }> = ({ title, subtitle, icon: Icon, children }) => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    
    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6">
            <div className="max-w-4xl mx-auto bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#1d1d1f] text-white p-10 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-[#B8860B] rounded-full flex items-center justify-center text-white mb-6 shadow-lg">
                            <Icon size={32} />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">{title}</h1>
                        <p className="text-white/60 font-light uppercase tracking-widest text-xs md:text-sm">{subtitle}</p>
                    </div>
                </div>
                <div className="p-8 md:p-16 text-[#1d1d1f] leading-relaxed font-light text-justify space-y-6 text-sm md:text-base">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const PrivacyPolicy = () => (
    <LegalLayout title="Política de Privacidade" subtitle="Lei Geral de Proteção de Dados (LGPD)" icon={Lock}>
        <p>A <strong>Magneto</strong> ("nós", "nosso") valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD).</p>
        
        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">1. Coleta de Dados</h3>
        <p>Coletamos apenas os dados estritamente necessários para a prestação dos nossos serviços de personalização e entrega de produtos, incluindo: Nome completo, CPF (para emissão de Nota Fiscal), endereço de entrega, e-mail, telefone e as imagens enviadas para personalização.</p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">2. Uso das Imagens</h3>
        <p>As imagens enviadas para a produção dos ímãs são tratadas com sigilo absoluto. Elas são armazenadas em nossos servidores seguros apenas pelo tempo necessário para a produção e garantia de qualidade (até 90 dias após a entrega). Após este período, os arquivos originais são excluídos permanentemente. <strong>Não utilizamos suas fotos para fins publicitários sem o seu consentimento expresso.</strong></p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">3. Compartilhamento de Dados</h3>
        <p>Não vendemos seus dados. O compartilhamento ocorre apenas com parceiros essenciais para a operação: transportadoras (para entrega), gateways de pagamento (para processamento financeiro) e órgãos fiscais (para emissão de NF-e).</p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">4. Seus Direitos (LGPD)</h3>
        <p>Você tem direito a confirmar a existência de tratamento, acessar seus dados, corrigir dados incompletos ou desatualizados e solicitar a eliminação de dados pessoais, exceto aqueles que precisamos manter por obrigação legal.</p>
    </LegalLayout>
);

export const TermsOfUse = () => (
    <LegalLayout title="Termos de Uso" subtitle="Regras de Utilização da Plataforma" icon={FileText}>
        <p>Bem-vindo à Magneto. Ao utilizar nosso site e serviços, você concorda com os termos descritos abaixo.</p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">1. Objeto</h3>
        <p>A Magneto é uma plataforma de e-commerce especializada na personalização e venda de ímãs fotográficos de alta qualidade ("Fine Art").</p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">2. Responsabilidade pelo Conteúdo</h3>
        <p>O usuário declara ser o titular dos direitos autorais ou ter autorização para uso das imagens enviadas. A Magneto não se responsabiliza por violações de direitos autorais ou de imagem de terceiros contidos nas fotos submetidas pelo cliente. Reservamo-nos o direito de recusar pedidos com conteúdo ilícito, pornográfico ou que incite ao ódio.</p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">3. Variação de Cor</h3>
        <p>Pode haver variação na tonalidade das cores entre a imagem visualizada em telas (padrão RGB, com luz própria) e o produto impresso (padrão CMYK, pigmento). Variações sutis não são consideradas defeito.</p>
    </LegalLayout>
);

export const ExchangePolicy = () => (
    <LegalLayout title="Política de Troca" subtitle="Código de Defesa do Consumidor" icon={RefreshCw}>
        <div className="bg-amber-50 border-l-4 border-[#B8860B] p-4 mb-8 text-sm text-amber-900">
            <strong>Atenção:</strong> Produtos personalizados possuem regras específicas de troca e devolução, conforme entendimento do Código de Defesa do Consumidor (CDC).
        </div>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">1. Produtos Personalizados</h3>
        <p>Nossos produtos são feitos sob encomenda exclusivamente para você. Devido à natureza personalizada, <strong>não aceitamos devoluções por arrependimento ou gosto pessoal</strong> (ex: "não gostei da foto que eu escolhi"), uma vez que o produto não pode ser revendido a terceiros. Esta exceção é amplamente reconhecida na jurisprudência brasileira para evitar prejuízos desproporcionais ao fornecedor de bens personalíssimos.</p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">2. Defeitos de Fabricação ou Avarias</h3>
        <p>Caso o produto apresente defeito de impressão, corte incorreto ou avaria no transporte, garantimos a <strong>troca imediata ou reembolso integral</strong>, conforme Art. 18 do CDC.</p>
        <ul className="list-disc pl-5 mt-4 space-y-2">
            <li><strong>Prazo:</strong> O cliente tem até 90 dias para reclamar de vícios aparentes.</li>
            <li><strong>Procedimento:</strong> Envie fotos do defeito para contato@magneto.com. Faremos uma análise em até 48h.</li>
        </ul>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">3. Erro no Endereço</h3>
        <p>Caso o pedido retorne devido a endereço incorreto fornecido pelo cliente, será cobrado um novo frete para reenvio.</p>
    </LegalLayout>
);

export const ShippingPolicy = () => (
    <LegalLayout title="Envios & Prazos" subtitle="Logística e Entrega" icon={Truck}>
        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">1. Prazo de Produção</h3>
        <p>Por ser um produto artesanal com acabamento manual, nosso prazo de produção é de <strong>2 a 4 dias úteis</strong> após a confirmação do pagamento.</p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">2. Prazos de Entrega</h3>
        <p>O prazo de entrega varia conforme a região e a modalidade escolhida (Sedex, PAC ou Transportadora Privada). O prazo total informado no carrinho já soma o tempo de produção + tempo de transporte.</p>

        <h3 className="font-bold text-lg text-[#1d1d1f] mt-8 mb-2">3. Atrasos e Extravios</h3>
        <p>A Magneto monitora todos os envios. Em caso de extravio confirmado pela transportadora, faremos a reprodução e reenvio do pedido sem custo adicional, ou o reembolso integral, conforme preferência do cliente.</p>
    </LegalLayout>
);
