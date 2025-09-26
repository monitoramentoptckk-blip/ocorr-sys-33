import React from 'react';
import { format, isPast, differenceInMonths, differenceInDays, startOfDay, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils"; // Import cn for conditional classNames
import { AlertTriangle, Paperclip } from "lucide-react"; // Import icons for better visual
import { PdfConfig } from './ReportCustomizationTab'; // Import PdfConfig type

interface CnhStatus {
  status: 'valid' | 'expiring_soon' | 'expired' | 'unknown';
  message: string;
  monthsDifference: number;
  daysDifference: number;
}

interface AttachmentItem {
  name: string;
  url: string;
}

interface IncidentReportPDFLayoutProps {
  formData: any; // Use a more specific type if available
  boAttachments: AttachmentItem[]; // Changed to structured array
  sapScreenshotAttachments: AttachmentItem[]; // Changed to structured array
  riskReportAttachments: AttachmentItem[]; // Changed to structured array
  omnilinkPhotoAttachment: AttachmentItem[]; // Changed to structured array
  cnhStatus: CnhStatus; // Pass CNH status directly
  pdfConfig: PdfConfig; // New prop for PDF configuration
  onRenderComplete?: () => void; // New prop to signal render completion
}

// Helper function to get CNH status (duplicated for PDF layout for self-containment)
const getCnhStatus = (licenseExpiryDateString: string): CnhStatus => {
  if (!licenseExpiryDateString) {
    return { status: 'unknown', message: 'Data de validade da CNH não informada.', monthsDifference: 0, daysDifference: 0 };
  }

  const [year, month, day] = licenseExpiryDateString.split('-').map(Number);
  const expiryDate = startOfDay(new Date(year, month - 1, day)); // Local date for expiry
  const today = startOfDay(new Date()); // Local date for today

  if (isNaN(expiryDate.getTime())) { // Robust check for invalid date
    return { status: 'unknown', message: 'Data de validade da CNH inválida.', monthsDifference: 0, daysDifference: 0 };
  }

  // Calculate difference: today - expiryDate
  const daysDiff = differenceInDays(today, expiryDate); // Positive if expiry is in the past, negative if expiry is in the future
  const monthsDiff = differenceInMonths(today, expiryDate);
  const yearsDiff = differenceInYears(today, expiryDate);

  let status: CnhStatus['status'];
  let message: string;

  if (daysDiff === 0) { // CNH vence hoje
    status = 'expiring_soon';
    message = 'CNH válida, mas vence hoje.';
  } else if (daysDiff < 0) { // CNH ainda válida (expiryDate is in the future relative to today)
    status = 'valid';
    const absDaysDiff = Math.abs(daysDiff);
    const absMonthsDiff = Math.abs(monthsDiff);
    const absYearsDiff = Math.abs(yearsDiff);

    if (absDaysDiff <= 30) {
      status = 'expiring_soon'; // Less than or equal to 30 days is 'expiring_soon'
    }

    message = 'CNH válida. Vence em ';
    if (absYearsDiff > 0) {
      message += `${absYearsDiff} ano${absYearsDiff > 1 ? 's' : ''}.`;
    } else if (absMonthsDiff > 0) {
      message += `${absMonthsDiff} mês${absMonthsDiff > 1 ? 'es' : ''}.`;
    } else {
      message += `${absDaysDiff} dia${absDaysDiff > 1 ? 's' : ''}.`;
    }
  } else { // CNH já vencida (daysDiff > 0) (expiryDate is in the past relative to today)
    status = 'expired';
    const absDaysDiff = Math.abs(daysDiff);
    const absMonthsDiff = Math.abs(monthsDiff);
    const absYearsDiff = Math.abs(yearsDiff);

    message = 'CNH vencida há ';
    if (absYearsDiff > 0) {
      message += `${absYearsDiff} ano${absYearsDiff > 1 ? 's' : ''}.`;
    } else if (absMonthsDiff > 0) {
      message += `${absMonthsDiff} mês${absMonthsDiff > 1 ? 'es' : ''}.`;
    } else {
      message += `${absDaysDiff} dia${absDaysDiff > 1 ? 's' : ''}.`;
    }
    message += ' - Gravíssimo';
  }

  return {
    status,
    message,
    daysDifference: daysDiff,
    monthsDifference: monthsDiff,
  };
};

const fieldLabels: { [key: string]: string } = {
  incidentNumber: "Nº da Ocorrência", incidentDate: "Data da Ocorrência", incidentTime: "Horário da Ocorrência",
  locationType: "Tipo de Local", establishmentName: "Nome do Estabelecimento", establishmentAddress: "Endereço do Estabelecimento",
  establishmentCircumstances: "Circunstâncias no Estabelecimento", hasDock: "Existe doca?", hasParking: "Tem estacionamento?",
  roadDetailedLocation: "Descrição Detalhada do Local", roadSuspicions: "Suspeitas", roadTrafficConditions: "Condições do Trânsito",
  roadWitnesses: "Testemunhas", boNumber: "Número do B.O.", boDate: "Data do B.O.", sameDay: "Registrado no mesmo dia",
  responsible: "Responsável pelo Registro",

  vehiclePlate: "Placa do Veículo", vehicleModel: "Modelo do Veículo", vehicleTechnology: "Tecnologias do Veículo",
  driverName: "Nome do Motorista", driverCpf: "CPF do Motorista", driverPhone: "Telefone do Motorista",
  driverLicense: "CNH do Motorista", licenseExpiry: "Validade da CNH",

  omnilinkStatus: "Motorista Apto", omnilinkObservations: "Observações Omnilink", omnilinkAnalystVerdict: "Veredito do Analista",

  signalLoss: "Perda de sinal", signalLossTime: "Tempo de ausência", unauthorizedStop: "Parada não programada",
  unauthorizedStopLocation: "Local da parada", prolongedStop: "Parada prolongada", prolongedStopTime: "Tempo parado",
  prolongedStopJustification: "Justificativa",

  followedInstructions: "Seguiu instruções?", reportedAnomalies: "Comunicou anormalidades?", contradictions: "Há contradições?",
  keyToThird: "Entregou chave a terceiros?", doorsOpen: "Deixou portas abertas?", leftVehicleTime: "Afastou-se por mais de 5 min?",
  vehicleLocked: "Veículo trancado?", driverNearVehicle: "Motorista próximo?", authorizedParking: "Estacionado em local autorizado?",
  vehicleRunning: "Veículo ligado sem vigilância?", stoppedInSafePlace: "Parou em local seguro?", activatedPanicButton: "Acionou botão de pânico?",
  driverScore: "Pontuação Total", riskLevel: "Nível de Risco",

  totalCargoValue: "Valor Total da Carga", stolenCargoValue: "Valor da Carga Furtada", cargoObservations: "Observações da Carga",

  riskObservations: "Observações de Risco",

  omnilinkSummary: "Resumo Omnilink", driverSummary: "Resumo do Condutor", trackingSummary: "Resumo Rastreamento",
  cargoSummary: "Resumo da Carga", riskSummary: "Resumo Monitoramento de Risco", finalConclusion: "Conclusão Geral",
  recommendations: "Recomendações e Análise Final", analystName: "Nome do Analista Responsável",

  boFiles: "Anexos do B.O.", sapScreenshots: "Prints do Sistema SAP", riskReports: "Relatórios de Risco", omnilinkPhoto: "Foto Omnilink",
};

export const IncidentReportPDFLayout: React.FC<IncidentReportPDFLayoutProps> = ({
  formData,
  boAttachments,
  sapScreenshotAttachments,
  riskReportAttachments,
  omnilinkPhotoAttachment,
  cnhStatus,
  pdfConfig,
  onRenderComplete, // Destructure the new prop
}) => {
  const isExecutiveSummary = pdfConfig.templateName === "Resumo Executivo";

  const [loadedImagesCount, setLoadedImagesCount] = React.useState(0);
  const totalImagesToLoad = React.useRef(0);

  React.useEffect(() => {
    // Ensure all attachment props are arrays before using them
    const safeBoAttachments = Array.isArray(boAttachments) ? boAttachments : [];
    const safeSapScreenshotAttachments = Array.isArray(sapScreenshotAttachments) ? sapScreenshotAttachments : [];
    const safeRiskReportAttachments = Array.isArray(riskReportAttachments) ? riskReportAttachments : [];
    const safeOmnilinkPhotoAttachment = Array.isArray(omnilinkPhotoAttachment) ? omnilinkPhotoAttachment : [];

    // Calculate total images to load once on mount or if attachments change
    const allAttachments = [
      ...safeBoAttachments,
      ...safeSapScreenshotAttachments,
      ...safeRiskReportAttachments,
      ...safeOmnilinkPhotoAttachment,
    ];
    totalImagesToLoad.current = allAttachments.filter(att => att.url).length;

    // If there are no images, signal completion immediately
    if (totalImagesToLoad.current === 0 && onRenderComplete) {
      onRenderComplete();
    }
  }, [boAttachments, sapScreenshotAttachments, riskReportAttachments, omnilinkPhotoAttachment, onRenderComplete]);

  React.useEffect(() => {
    // Signal completion only when all images are loaded (if there are any)
    if (totalImagesToLoad.current > 0 && loadedImagesCount === totalImagesToLoad.current && onRenderComplete) {
      onRenderComplete();
    }
  }, [loadedImagesCount, totalImagesToLoad.current, onRenderComplete]);

  const handleImageLoad = () => {
    setLoadedImagesCount(prev => prev + 1);
  };

  const renderField = (label: string, value: any, className?: string) => {
    if (!value && value !== false && value !== 0) return null; // Don't render if value is empty or null/undefined

    let displayValue = value;
    if (typeof value === 'boolean') {
      displayValue = value ? 'Sim' : 'Não';
    } else if (label.includes('Data') && value) {
      try {
        displayValue = format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
      } catch (e) {
        displayValue = value; // Fallback if date parsing fails
      }
    } else if (label.includes('Horário') && value) {
      displayValue = value; // Time is usually already in HH:mm format
    } else if (Array.isArray(value)) { // Handle array of strings for technology
      displayValue = value.join(', ');
    }

    return (
      <div className={cn("mb-2", className)}>
        <p className={cn("text-xs font-semibold", isExecutiveSummary ? "text-gray-600" : "text-gray-700")}>{label}:</p>
        <p className={cn("text-sm", isExecutiveSummary ? "text-gray-800" : "text-gray-900")}>{displayValue}</p>
      </div>
    );
  };

  const renderSection = (sectionId: string, title: string, description: string, content: React.ReactNode) => {
    const sectionConfig = pdfConfig.sections[sectionId];
    if (!sectionConfig || !sectionConfig.isVisible) return null;

    const hasContent = React.Children.toArray(content).some(child => child !== null);

    if (!hasContent && !sectionConfig.customText) return null; // Don't render section if no visible fields and no custom text

    return (
      <div className={cn(
        "mb-8 p-6 border rounded-lg shadow-sm",
        isExecutiveSummary ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white"
      )}>
        <h3 className={cn(
          "text-lg font-bold mb-2",
          isExecutiveSummary ? "text-gray-800" : "text-blue-800"
        )}>{title}</h3>
        <p className={cn("text-sm mb-4", isExecutiveSummary ? "text-gray-600" : "text-gray-600")}>{description}</p>
        {sectionConfig.customText && (
          <p className={cn("text-sm mb-4 whitespace-pre-wrap", isExecutiveSummary ? "text-gray-700" : "text-gray-800")}>{sectionConfig.customText}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content}
        </div>
      </div>
    );
  };

  const renderAttachments = (sectionId: string, title: string, fieldId: string, attachments: AttachmentItem[]) => {
    const sectionConfig = pdfConfig.sections[sectionId];
    if (!sectionConfig || !sectionConfig.isVisible) return null;

    // Ensure fields is an object, even if it was somehow missing
    const fields = sectionConfig.fields || {}; 

    // Check visibility for the specific attachment field
    const isAttachmentFieldVisible = fields[fieldId];
    if (!isAttachmentFieldVisible) return null; // If the specific field is not visible, don't render this attachment type

    // Ensure attachments is an array before filtering
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    // Filter attachments based on visibility
    const visibleAttachments = safeAttachments.filter(att => att.url); // This is where filter is called

    // Only render the section title if there are actual files/urls or custom text
    if (visibleAttachments.length === 0 && !sectionConfig.customText) return null;

    return (
      <div className={cn(
        "mb-8 p-6 border rounded-lg shadow-sm",
        isExecutiveSummary ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white"
      )}>
        <h3 className={cn(
          "text-lg font-bold mb-4",
          isExecutiveSummary ? "text-gray-800" : "text-blue-800"
        )}>{title}</h3>
        {sectionConfig.customText && (
          <p className={cn("text-sm mb-4 whitespace-pre-wrap", isExecutiveSummary ? "text-gray-700" : "text-gray-800")}>{sectionConfig.customText}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {visibleAttachments.map((attachment, index) => (
            <div key={index} className={cn(
              "p-2 border rounded-md flex flex-col items-center text-center",
              isExecutiveSummary ? "border-gray-200 bg-gray-100" : "border-gray-200 bg-gray-50"
            )}>
              <p className={cn("text-xs font-semibold mb-2", isExecutiveSummary ? "text-gray-700" : "text-gray-800")}>{attachment.name}</p>
              <img src={attachment.url} alt={attachment.name} className="max-w-full h-auto rounded-sm object-contain" onLoad={handleImageLoad} />
            </div>
          ))}
        </div>
        {!visibleAttachments.length && !sectionConfig.customText && (
          <p className={cn("text-sm", isExecutiveSummary ? "text-gray-500" : "text-gray-600")}>Nenhum anexo disponível.</p>
        )}
      </div>
    );
  };

  const isFieldVisible = (sectionId: string, fieldId: string) => {
    // Ensure sectionConfig and its fields property exist before accessing
    const sectionConfig = pdfConfig.sections[sectionId];
    return sectionConfig?.isVisible && (sectionConfig.fields?.[fieldId] ?? false);
  };

  return (
    <div className="font-sans text-gray-900 p-8 bg-gray-50 min-h-screen print:p-0 print:bg-white">
      <div className={cn(
        "max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none",
        isExecutiveSummary ? "border border-gray-300" : ""
      )}>
        {/* Header */}
        <div className={cn(
          "text-white p-6 flex items-center justify-between",
          isExecutiveSummary ? "bg-gray-800" : "bg-gradient-to-r from-blue-700 to-cyan-600"
        )}>
          <div>
            <h1 className="text-2xl font-bold">{pdfConfig.globalHeader || 'Laudo de Ocorrência'}</h1>
            <p className="text-sm opacity-90">Karne & Keijo - Sistema de Gestão</p>
          </div>
          <div className="text-right">
            {isFieldVisible('identification', 'incidentNumber') && <p className="text-lg font-semibold">Nº: {formData.incidentNumber || 'N/A'}</p>}
            {isFieldVisible('identification', 'incidentDate') && <p className="text-sm opacity-90">Data: {formData.incidentDate ? format(new Date(formData.incidentDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>}
          </div>
        </div>

        <div className="p-6">
          {/* Identificação da Ocorrência */}
          {renderSection(
            "identification",
            "1. Identificação da Ocorrência",
            "Informações básicas sobre a ocorrência e registro policial.",
            <>
              {isFieldVisible('identification', 'incidentNumber') && renderField("Nº da Ocorrência", formData.incidentNumber)}
              {isFieldVisible('identification', 'incidentDate') && renderField("Data da Ocorrência", formData.incidentDate)}
              {isFieldVisible('identification', 'incidentTime') && renderField("Horário da Oorrência", formData.incidentTime)}
              {isFieldVisible('identification', 'locationType') && renderField("Tipo de Local", formData.locationType === "establishment" ? "Em estabelecimento" : formData.locationType === "public_road" ? "Em rodovia/rua/via pública" : "N/A")}
              
              {formData.locationType === "establishment" && (
                <>
                  {isFieldVisible('identification', 'establishmentName') && renderField("Nome do Estabelecimento", formData.establishmentName)}
                  {isFieldVisible('identification', 'establishmentAddress') && renderField("Endereço do Estabelecimento", formData.establishmentAddress)}
                  {isFieldVisible('identification', 'establishmentCircumstances') && renderField("Circunstâncias no Estabelecimento", formData.establishmentCircumstances, "col-span-full")}
                  {isFieldVisible('identification', 'hasDock') && renderField("Existe doca no estabelecimento?", formData.hasDock)}
                  {isFieldVisible('identification', 'hasParking') && renderField("Tem estacionamento disponível?", formData.hasParking)}
                </>
              )}

              {formData.locationType === "public_road" && (
                <>
                  {isFieldVisible('identification', 'roadDetailedLocation') && renderField("Descrição Detalhada do Local", formData.roadDetailedLocation, "col-span-full")}
                  {isFieldVisible('identification', 'roadSuspicions') && renderField("Suspeitas (Veículos/Individuos)", formData.roadSuspicions, "col-span-full")}
                  {isFieldVisible('identification', 'roadTrafficConditions') && renderField("Condições do Trânsito", formData.roadTrafficConditions)}
                  {isFieldVisible('identification', 'roadWitnesses') && renderField("Testemunhas", formData.roadWitnesses)}
                </>
              )}

              {isFieldVisible('identification', 'boNumber') && renderField("Número do B.O.", formData.boNumber)}
              {isFieldVisible('identification', 'boDate') && renderField("Data do B.O.", formData.boDate)}
              {isFieldVisible('identification', 'sameDay') && renderField("Registrado no mesmo dia", formData.sameDay)}
              {isFieldVisible('identification', 'responsible') && renderField("Responsável pelo Registro", formData.responsible)}
            </>
          )}

          {/* Dados do Veículo e Motorista */}
          {renderSection(
            "vehicle",
            "2. Dados do Veículo e Motorista",
            "Informações sobre o veículo e condutor envolvidos na ocorrência.",
            <>
              {isFieldVisible('vehicle', 'vehiclePlate') && renderField("Placa do Veículo", formData.vehiclePlate)}
              {isFieldVisible('vehicle', 'vehicleModel') && renderField("Modelo do Veículo", formData.vehicleModel)}
              {isFieldVisible('vehicle', 'vehicleTechnology') && renderField("Tecnologias do Veículo", formData.vehicleTechnology)}
              {isFieldVisible('vehicle', 'driverName') && renderField("Nome do Motorista", formData.driverName)}
              {isFieldVisible('vehicle', 'driverCpf') && renderField("CPF do Motorista", formData.driverCpf)}
              {isFieldVisible('vehicle', 'driverPhone') && renderField("Telefone do Motorista", formData.driverPhone)}
              {isFieldVisible('vehicle', 'driverLicense') && renderField("CNH do Motorista", formData.driverLicense)}
              {isFieldVisible('vehicle', 'licenseExpiry') && renderField("Validade da CNH", formData.licenseExpiry)}
              {cnhStatus.status !== 'valid' && cnhStatus.status !== 'unknown' && isFieldVisible('vehicle', 'licenseExpiry') && (
                <div className={cn(
                  "col-span-full text-sm font-medium flex items-center gap-1",
                  cnhStatus.status === 'expired' && "text-red-600", // Red for expired
                  cnhStatus.status === 'expiring_soon' && "text-orange-500" // Orange for expiring soon
                )}>
                  <AlertTriangle className="h-4 w-4" /> {cnhStatus.message}
                </div>
              )}
            </>
          )}

          {/* Laudo Omnilink (Gestor) */}
          {renderSection(
            "omnilink",
            "3. Laudo Omnilink (Gestor)",
            "Status de aptidão do motorista e observações do sistema Omnilink.",
            <>
              {isFieldVisible('omnilink', 'omnilinkStatus') && renderField("Motorista Apto", formData.omnilinkStatus)}
              {isFieldVisible('omnilink', 'omnilinkObservations') && renderField("Observações Omnilink", formData.omnilinkObservations, "col-span-full")}
              {isFieldVisible('omnilink', 'omnilinkAnalystVerdict') && renderField("Veredito do Analista", formData.omnilinkAnalystVerdict, "col-span-full")}
            </>
          )}

          {/* Laudo Siga+ (Rastreamento) */}
          {renderSection(
            "tracking",
            "4. Laudo Siga+ (Rastreamento)",
            "Informações detalhadas do sistema de rastreamento.",
            <>
              {isFieldVisible('tracking', 'signalLoss') && renderField("Perda de sinal de rastreamento", formData.signalLoss)}
              {isFieldVisible('tracking', 'signalLossTime') && formData.signalLoss === "yes" && renderField("Tempo de ausência do sinal", formData.signalLossTime)}
              {isFieldVisible('tracking', 'unauthorizedStop') && renderField("Parada em local não programado", formData.unauthorizedStop)}
              {isFieldVisible('tracking', 'unauthorizedStopLocation') && formData.unauthorizedStop === "yes" && renderField("Local da parada", formData.unauthorizedStopLocation)}
              {isFieldVisible('tracking', 'prolongedStop') && renderField("Parada prolongada em local de risco/não autorizado", formData.prolongedStop)}
              {isFieldVisible('tracking', 'prolongedStopTime') && formData.prolongedStop === "yes" && renderField("Tempo parado", formData.prolongedStopTime)}
              {isFieldVisible('tracking', 'prolongedStopJustification') && formData.prolongedStop === "yes" && renderField("Justificativa do motorista", formData.prolongedStopJustification)}
            </>
          )}

          {/* Apuração do Condutor */}
          {renderSection(
            "evaluation",
            "5. Apuração do Condutor",
            "Avaliação do comportamento do condutor com base em perguntas ponderadas.",
            <>
              {/* Common Questions */}
              {isFieldVisible('evaluation', 'followedInstructions') && renderField("Seguiu instruções da Karne & Keijo?", formData.followedInstructions)}
              {isFieldVisible('evaluation', 'reportedAnomalies') && renderField("Comunicou anormalidades imediatamente?", formData.reportedAnomalies)}
              {isFieldVisible('evaluation', 'contradictions') && renderField("Há contradições na versão?", formData.contradictions)}
              {isFieldVisible('evaluation', 'keyToThird') && renderField("Entregou chave a terceiros não autorizados?", formData.keyToThird)}
              {isFieldVisible('evaluation', 'doorsOpen') && renderField("Deixou portas abertas ou vidros abaixados?", formData.doorsOpen)}
              {isFieldVisible('evaluation', 'leftVehicleTime') && renderField("Motorista se afastou por mais de 5 min?", formData.leftVehicleTime)}

              {/* Conditional Questions based on locationType */}
              {formData.locationType === "establishment" && (
                <>
                  {isFieldVisible('evaluation', 'vehicleLocked') && renderField("O veículo foi trancado e alarmado?", formData.vehicleLocked)}
                  {isFieldVisible('evaluation', 'driverNearVehicle') && renderField("Motorista permaneceu próximo ao veículo?", formData.driverNearVehicle)}
                  {isFieldVisible('evaluation', 'authorizedParking') && renderField("Veículo estacionado em local autorizado?", formData.authorizedParking)}
                </>
              )}

              {formData.locationType === "public_road" && (
                <>
                  {isFieldVisible('evaluation', 'vehicleRunning') && renderField("Veículo permaneceu ligado sem vigilância?", formData.vehicleRunning)}
                  {isFieldVisible('evaluation', 'stoppedInSafePlace') && renderField("Parou em local seguro/autorizado?", formData.stoppedInSafePlace)}
                  {isFieldVisible('evaluation', 'activatedPanicButton') && renderField("Acionou o botão de pânico/alerta?", formData.activatedPanicButton)}
                </>
              )}

              {(isFieldVisible('evaluation', 'driverScore') || isFieldVisible('evaluation', 'riskLevel')) && (
                <div className={cn(
                  "col-span-full mt-4 p-4 rounded-md border",
                  isExecutiveSummary ? "bg-gray-100 border-gray-300" : "bg-blue-50 border-blue-200"
                )}>
                  {isFieldVisible('evaluation', 'driverScore') && <p className={cn("text-sm font-semibold", isExecutiveSummary ? "text-gray-800" : "text-blue-800")}>Pontuação Total: <span className="text-lg font-bold">{formData.driverScore}</span></p>}
                  {isFieldVisible('evaluation', 'riskLevel') && <p className={cn("text-sm font-semibold", isExecutiveSummary ? "text-gray-800" : "text-blue-800")}>Nível de Risco: <span className="text-lg font-bold">{formData.riskLevel}</span></p>}
                </div>
              )}
            </>
          )}

          {/* Apuração da Carga */}
          {renderSection(
            "cargo",
            "6. Apuração da Carga",
            "Detalhes sobre a carga transportada e possíveis perdas.",
            <>
              {isFieldVisible('cargo', 'totalCargoValue') && renderField("Valor Total da Carga (R$)", formData.totalCargoValue)}
              {isFieldVisible('cargo', 'stolenCargoValue') && renderField("Valor da Carga Furtada (R$)", formData.stolenCargoValue)}
              {isFieldVisible('cargo', 'cargoObservations') && renderField("Observações da Carga", formData.cargoObservations, "col-span-full")}
            </>
          )}

          {/* Monitoramento de Risco */}
          {renderSection(
            "risk",
            "7. Monitoramento de Risco",
            "Relatórios e análises de risco adicionais.",
            <>
              {isFieldVisible('risk', 'riskObservations') && renderField("Observações de Risco", formData.riskObservations, "col-span-full")}
            </>
          )}

          {/* Laudo Final Consolidado */}
          {renderSection(
            "final",
            "8. Laudo Final Consolidado",
            "Resumo das apurações e conclusões finais da ocorrência.",
            <>
              {isFieldVisible('final', 'omnilinkSummary') && renderField("Resumo Omnilink", formData.omnilinkSummary, "col-span-full")}
              {isFieldVisible('final', 'driverSummary') && renderField("Resumo do Condutor", formData.driverSummary, "col-span-full")}
              {isFieldVisible('final', 'trackingSummary') && renderField("Resumo Rastreamento", formData.trackingSummary, "col-span-full")}
              {isFieldVisible('final', 'cargoSummary') && renderField("Resumo da Carga", formData.cargoSummary, "col-span-full")}
              {isFieldVisible('final', 'riskSummary') && renderField("Resumo Monitoramento de Risco", formData.riskSummary, "col-span-full")}
              {isFieldVisible('final', 'finalConclusion') && renderField("Conclusão Geral", formData.finalConclusion)}
              {isFieldVisible('final', 'recommendations') && renderField("Recomendações e Análise Final", formData.recommendations, "col-span-full")}
              {isFieldVisible('final', 'analystName') && renderField("Nome do Analista Responsável", formData.analystName)}
            </>
          )}

          {/* Anexos do Laudo */}
          {renderAttachments(
            "attachments",
            "9. Anexos do B.O.",
            "boFiles", // New fieldId parameter
            boAttachments
          )}
          {renderAttachments(
            "attachments",
            "Prints do Sistema SAP",
            "sapScreenshots", // New fieldId parameter
            sapScreenshotAttachments
          )}
          {renderAttachments(
            "attachments",
            "Prints/Relatórios de Monitoramento de Risco",
            "riskReports", // New fieldId parameter
            riskReportAttachments
          )}
          {renderAttachments(
            "attachments",
            "Foto Omnilink",
            "omnilinkPhoto", // New fieldId parameter
            omnilinkPhotoAttachment
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "p-4 text-center text-xs border-t",
          isExecutiveSummary ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-gray-100 text-gray-600 border-gray-200"
        )}>
          {pdfConfig.globalFooter || `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })} pelo Sistema de Gestão Karne & Keijo.`}
        </div>
      </div>
    </div>
  );
};