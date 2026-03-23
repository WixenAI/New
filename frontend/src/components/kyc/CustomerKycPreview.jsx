import { formatCurrency, formatDate } from "../../utils/formatters";
import { resolveAssetUrl } from "../../utils/assets";

function DocumentBlock({ title, src, alt }) {
  return (
    <div className="kyc-preview__document-block">
      <span>{title}</span>
      {src ? (
        <img src={resolveAssetUrl(src)} alt={alt} className="kyc-preview__document-image" />
      ) : (
        <div className="kyc-preview__document-placeholder">Not uploaded</div>
      )}
    </div>
  );
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export default function CustomerKycPreview({ broker, client }) {
  if (!broker || !client) {
    return null;
  }

  const kyc = client.kyc || {};
  const fallbackNames = splitName(client.fullName);

  return (
    <div className="kyc-preview">
      <div className="kyc-preview__sheet">
        <header className="kyc-preview__header">
          <div className="kyc-preview__brand">
            {broker?.branding?.logoUrl ? (
              <img src={resolveAssetUrl(broker.branding.logoUrl)} alt={`${broker.name} logo`} className="kyc-preview__brand-logo" />
            ) : (
              <div className="kyc-preview__brand-logo kyc-preview__brand-logo--fallback">{broker?.branding?.logoText || "BR"}</div>
            )}
            <div>
              <h2>{broker?.branding?.brokerageHouseName || broker?.name}</h2>
              <p>KYC & Client Registration Form</p>
              <small>Registered with Securities and Exchange Board of India (SEBI) as a Stock Broker</small>
            </div>
          </div>
        </header>

        <section className="kyc-preview__section">
          <div className="kyc-preview__section-head">
            <h3>Applicant details</h3>
          </div>
          <div className="kyc-preview__grid kyc-preview__grid--two">
            <div><span>First name</span><strong>{kyc.firstName || fallbackNames.firstName || "-"}</strong></div>
            <div><span>Last name</span><strong>{kyc.lastName || fallbackNames.lastName || "-"}</strong></div>
            <div><span>Father's name</span><strong>{kyc.fatherName || "-"}</strong></div>
            <div><span>Date of birth</span><strong>{formatDate(kyc.dateOfBirth)}</strong></div>
            <div><span>Gender</span><strong>{kyc.gender ? kyc.gender.toUpperCase() : "-"}</strong></div>
            <div><span>Date of application</span><strong>{formatDate(kyc.applicationDate)}</strong></div>
            <div><span>Mobile</span><strong>{client.phone || "-"}</strong></div>
            <div><span>Email</span><strong>{client.email || "-"}</strong></div>
            <div><span>Initial deposit</span><strong>{formatCurrency(kyc.initialDeposit || 0)}</strong></div>
            <div className="kyc-preview__grid-span"><span>Address</span><strong>{client.address || "-"}</strong></div>
          </div>
        </section>

        <section className="kyc-preview__section">
          <div className="kyc-preview__section-head">
            <h3>Identity details</h3>
          </div>
          <div className="kyc-preview__grid kyc-preview__grid--two">
            <div><span>Aadhaar number</span><strong>{kyc.aadhaarNumber || "-"}</strong></div>
            <div><span>PAN number</span><strong>{kyc.panNumber || "-"}</strong></div>
          </div>
          <div className="kyc-preview__documents-grid">
            <DocumentBlock title="Customer photo" src={kyc.customerPhotoUrl} alt="Customer" />
            <DocumentBlock title="Customer signature" src={kyc.customerSignatureUrl} alt="Customer signature" />
            <DocumentBlock title="Aadhaar front" src={kyc.aadhaarFrontUrl} alt="Aadhaar front" />
            <DocumentBlock title="Aadhaar back" src={kyc.aadhaarBackUrl} alt="Aadhaar back" />
            <DocumentBlock title="PAN card" src={kyc.panImageUrl} alt="PAN card" />
          </div>
        </section>

        <section className="kyc-preview__section">
          <div className="kyc-preview__section-head">
            <h3>Declaration</h3>
          </div>
          <p className="kyc-preview__declaration">
            I confirm that the information and supporting documents submitted in this KYC form are correct to the best of my knowledge.
          </p>

          <div className="kyc-preview__signatures">
            <div>
              <span>Customer signature</span>
              {kyc.customerSignatureUrl ? (
                <img src={resolveAssetUrl(kyc.customerSignatureUrl)} alt="Customer signature" className="kyc-preview__signature-image" />
              ) : (
                <div className="kyc-preview__signature-line" />
              )}
            </div>

            <div>
              <span>Registered mark</span>
              {broker?.branding?.trademarkUrl ? (
                <img src={resolveAssetUrl(broker.branding.trademarkUrl)} alt="Broker stamp" className="kyc-preview__mark-image" />
              ) : (
                <div className="kyc-preview__signature-line" />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
