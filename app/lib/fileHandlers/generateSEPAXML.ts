type SEPAPayment = {
  id: string;
  name: string;
  iban: string;
  bic?: string;
  amount: number;
  currency?: string;
  reference: string;
};

type SEPAOptions = {
  organizationName: string;
  organizationIban?: string;
  organizationBic?: string;
  executionDate?: string; // YYYY-MM-DD, defaults to today
  payments: SEPAPayment[];
};

export function generateSEPAXML(options: SEPAOptions): Blob {
  const {
    organizationName,
    organizationIban = "TOBEFILLEDIN",
    organizationBic = "TOBEFILLEDIN",
    executionDate = new Date().toISOString().slice(0, 10),
    payments,
  } = options;

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2);
  const msgId = `MSG-${Date.now()}`;
  const pmtInfId = `PMT-${Date.now()}`;
  const createdAt = new Date().toISOString().slice(0, 19);

  const transactions = payments
    .map(
      (p) => `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${escapeXml(p.id)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${p.currency ?? "EUR"}">${p.amount.toFixed(2)}</InstdAmt>
        </Amt>
        ${
          p.bic
            ? `<CdtrAgt>
          <FinInstnId>
            <BIC>${escapeXml(p.bic)}</BIC>
          </FinInstnId>
        </CdtrAgt>`
            : ""
        }
        <Cdtr>
          <Nm>${escapeXml(p.name)}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${p.iban.replace(/\s/g, "")}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${escapeXml(p.reference)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.003.03"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="urn:iso:std:iso:20022:tech:xsd:pain.001.003.03 pain.001.003.03.xsd">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${createdAt}</CreDtTm>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${totalAmount}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(organizationName)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${pmtInfId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${totalAmount}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${executionDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>${escapeXml(organizationName)}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${organizationIban.replace(/\s/g, "")}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${escapeXml(organizationBic)}</BIC>
        </FinInstnId>
      </DbtrAgt>
      ${transactions}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

  return new Blob([xml], { type: "application/xml" });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
