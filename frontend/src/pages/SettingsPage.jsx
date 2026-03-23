import { useEffect, useState } from "react";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../context/AppContext";
import { resolveAssetUrl } from "../utils/assets";

const initialForm = {
  name: "",
  tokenId: "",
  legalName: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  supportDesk: "",
  brokerageHouseName: "",
  logoText: "",
  shortName: "",
  headerTone: "",
  signatureLabel: "Authorized Signature",
  trademarkLabel: "Registered Mark",
  statementPrefix: "ST",
  statementTitle: "Closed Trade Statement",
  statementSubtitle: "Portfolio P&L Report",
  clientLabel: "Client ID",
  receiptPrefix: "RCP",
  invoicePrefix: "PVT",
  footerText: "",
  supportText: "",
  disclaimer: "",
  showSignature: true,
  showTrademark: false,
};

function SettingsAccordion({ title, description, children, defaultOpen = true }) {
  return (
    <details className="settings-accordion" open={defaultOpen}>
      <summary>
        <div>
          <strong>{title}</strong>
          {description ? <span>{description}</span> : null}
        </div>
      </summary>
      <div className="settings-accordion__content">{children}</div>
    </details>
  );
}

export default function SettingsPage() {
  const { brokers, selectedBroker, selectedBrokerId, setSelectedBrokerId, updateBroker, refreshBrokers } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedBroker) {
      setForm(initialForm);
      return;
    }

    setForm({
      name: selectedBroker.name || "",
      tokenId: selectedBroker.tokenId || "",
      legalName: selectedBroker.legalName || "",
      contactEmail: selectedBroker.contact?.email || "",
      contactPhone: selectedBroker.contact?.phone || "",
      website: selectedBroker.contact?.website || "",
      supportDesk: selectedBroker.contact?.supportDesk || "",
      brokerageHouseName: selectedBroker.branding?.brokerageHouseName || selectedBroker.name || "",
      logoText: selectedBroker.branding?.logoText || "",
      shortName: selectedBroker.branding?.shortName || "",
      headerTone: selectedBroker.branding?.headerTone || "",
      signatureLabel: selectedBroker.branding?.signatureLabel || "Authorized Signature",
      trademarkLabel: selectedBroker.branding?.trademarkLabel || "Registered Mark",
      statementPrefix: selectedBroker.documents?.statementPrefix || "ST",
      statementTitle: selectedBroker.documents?.statementTitle || "Closed Trade Statement",
      statementSubtitle: selectedBroker.documents?.statementSubtitle || "Portfolio P&L Report",
      clientLabel: selectedBroker.documents?.clientLabel || "Client ID",
      receiptPrefix: selectedBroker.documents?.receiptPrefix || "RCP",
      invoicePrefix: selectedBroker.documents?.invoicePrefix || "PVT",
      footerText: selectedBroker.documents?.footerText || "",
      supportText: selectedBroker.documents?.supportText || "",
      disclaimer: selectedBroker.documents?.disclaimer || "",
      showSignature: selectedBroker.documents?.showSignature ?? true,
      showTrademark: selectedBroker.documents?.showTrademark ?? false,
    });
  }, [selectedBroker]);

  useEffect(() => {
    setMessage("");
    setError("");
  }, [selectedBrokerId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateBroker(selectedBroker._id, {
        name: form.name,
        tokenId: form.tokenId,
        legalName: form.legalName,
        contact: {
          email: form.contactEmail,
          phone: form.contactPhone,
          website: form.website,
          supportDesk: form.supportDesk,
        },
        branding: {
          brokerageHouseName: form.brokerageHouseName,
          logoText: form.logoText,
          shortName: form.shortName,
          headerTone: form.headerTone,
          signatureLabel: form.signatureLabel,
          trademarkLabel: form.trademarkLabel,
        },
        documents: {
          statementPrefix: form.statementPrefix,
          statementTitle: form.statementTitle,
          statementSubtitle: form.statementSubtitle,
          clientLabel: form.clientLabel,
          receiptPrefix: form.receiptPrefix,
          invoicePrefix: form.invoicePrefix,
          footerText: form.footerText,
          supportText: form.supportText,
          disclaimer: form.disclaimer,
          showSignature: form.showSignature,
          showTrademark: form.showTrademark,
        },
      });
      setMessage("Broker branding saved.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save broker settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssetUpload(assetType, file) {
    if (!selectedBroker || !file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(assetType);
    setError("");
    setMessage("");

    try {
      await api.post(`/api/brokers/${selectedBroker._id}/assets/${assetType}`, formData);
      await refreshBrokers();
      setMessage(`${assetType} uploaded successfully.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to upload ${assetType}.`);
    } finally {
      setUploading("");
    }
  }

  if (!selectedBroker) {
    return <EmptyState title="No broker selected" />;
  }

  const logoUrl = resolveAssetUrl(selectedBroker.branding?.logoUrl);
  const signatureUrl = resolveAssetUrl(selectedBroker.branding?.signatureUrl);
  const trademarkUrl = resolveAssetUrl(selectedBroker.branding?.trademarkUrl);

  return (
    <section className="page-grid">
      <PageHeader title="Branding" />

      {error ? <div className="alert-strip">{error}</div> : null}
      {message ? <div className="alert-strip alert-strip--success">{message}</div> : null}

      <div className="content-grid content-grid--settings">
        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <h3>Broker settings</h3>
            <span>{selectedBroker.branding?.brokerageHouseName || selectedBroker.name}</span>
          </div>

          <form className="settings-form" onSubmit={handleSubmit}>
            <SettingsAccordion title="Workspace identity">
              <div className="form-grid settings-form__grid">
                <label>
                  Broker name
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label>
                  Token ID
                  <input value={form.tokenId} onChange={(event) => setForm({ ...form, tokenId: event.target.value.toUpperCase() })} />
                </label>
                <label>
                  Legal name
                  <input value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} />
                </label>
                <label>
                  Brokerage house name
                  <input value={form.brokerageHouseName} onChange={(event) => setForm({ ...form, brokerageHouseName: event.target.value })} />
                </label>
                <label>
                  Logo text fallback
                  <input value={form.logoText} onChange={(event) => setForm({ ...form, logoText: event.target.value })} />
                </label>
                <label>
                  Short name
                  <input value={form.shortName} onChange={(event) => setForm({ ...form, shortName: event.target.value })} />
                </label>
              </div>
            </SettingsAccordion>

            <SettingsAccordion title="Contact and support">
              <div className="form-grid settings-form__grid">
                <label>
                  Contact email
                  <input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} />
                </label>
                <label>
                  Contact phone
                  <input value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
                </label>
                <label>
                  Website
                  <input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
                </label>
                <label>
                  Support desk
                  <input value={form.supportDesk} onChange={(event) => setForm({ ...form, supportDesk: event.target.value })} />
                </label>
              </div>
            </SettingsAccordion>

            <SettingsAccordion title="Document labels">
              <div className="form-grid settings-form__grid settings-form__grid--dense">
                <label>
                  Statement prefix
                  <input value={form.statementPrefix} onChange={(event) => setForm({ ...form, statementPrefix: event.target.value.toUpperCase() })} />
                </label>
                <label>
                  Statement title
                  <input value={form.statementTitle} onChange={(event) => setForm({ ...form, statementTitle: event.target.value })} />
                </label>
                <label>
                  Statement subtitle
                  <input value={form.statementSubtitle} onChange={(event) => setForm({ ...form, statementSubtitle: event.target.value })} />
                </label>
                <label>
                  Client label
                  <input value={form.clientLabel} onChange={(event) => setForm({ ...form, clientLabel: event.target.value })} />
                </label>
                <label>
                  Receipt prefix
                  <input value={form.receiptPrefix} onChange={(event) => setForm({ ...form, receiptPrefix: event.target.value.toUpperCase() })} />
                </label>
                <label>
                  Invoice prefix
                  <input value={form.invoicePrefix} onChange={(event) => setForm({ ...form, invoicePrefix: event.target.value.toUpperCase() })} />
                </label>
                <label>
                  Signature label
                  <input value={form.signatureLabel} onChange={(event) => setForm({ ...form, signatureLabel: event.target.value })} />
                </label>
                <label>
                  Trademark label
                  <input value={form.trademarkLabel} onChange={(event) => setForm({ ...form, trademarkLabel: event.target.value })} />
                </label>
              </div>
            </SettingsAccordion>

            <SettingsAccordion title="Footer and visibility">
              <div className="form-grid settings-form__grid">
                <label className="toggle-field">
                  <input
                    type="checkbox"
                    checked={form.showSignature}
                    onChange={(event) => setForm({ ...form, showSignature: event.target.checked })}
                  />
                  <span>Show signature on template</span>
                </label>
                <label className="toggle-field">
                  <input
                    type="checkbox"
                    checked={form.showTrademark}
                    onChange={(event) => setForm({ ...form, showTrademark: event.target.checked })}
                  />
                  <span>Show trademark on template</span>
                </label>
                <label className="settings-form__wide">
                  Footer text
                  <textarea value={form.footerText} onChange={(event) => setForm({ ...form, footerText: event.target.value })} rows="3" />
                </label>
                <label className="settings-form__wide">
                  Support text
                  <textarea value={form.supportText} onChange={(event) => setForm({ ...form, supportText: event.target.value })} rows="2" />
                </label>
                <label className="settings-form__wide">
                  Disclaimer
                  <textarea value={form.disclaimer} onChange={(event) => setForm({ ...form, disclaimer: event.target.value })} rows="4" />
                </label>
              </div>
            </SettingsAccordion>

            <div className="form-savebar">
              <label className="form-savebar__broker">
                <span>Broker token ID</span>
                <select value={selectedBrokerId} onChange={(event) => setSelectedBrokerId(event.target.value)} disabled={!brokers.length || saving}>
                  {brokers.map((broker) => (
                    <option key={broker._id} value={broker._id}>
                      {broker.tokenId} - {broker.branding?.brokerageHouseName || broker.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Broker Setup"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <h3>Assets</h3>
            <span>Logo, signature, trademark</span>
          </div>

          <div className="upload-grid">
            <label className="upload-card">
              <span>Logo</span>
              {logoUrl ? <img src={logoUrl} alt="Broker logo" className="upload-card__preview upload-card__preview--logo" /> : <div className="upload-card__placeholder">No logo uploaded</div>}
              <input type="file" accept="image/*" onChange={(event) => handleAssetUpload("logo", event.target.files?.[0])} />
              <small>{uploading === "logo" ? "Uploading..." : "Upload broker logo"}</small>
            </label>

            <label className="upload-card">
              <span>Signature</span>
              {signatureUrl ? <img src={signatureUrl} alt="Broker signature" className="upload-card__preview" /> : <div className="upload-card__placeholder">No signature uploaded</div>}
              <input type="file" accept="image/*" onChange={(event) => handleAssetUpload("signature", event.target.files?.[0])} />
              <small>{uploading === "signature" ? "Uploading..." : "Upload signature image"}</small>
            </label>

            <label className="upload-card">
              <span>Trademark / Seal</span>
              {trademarkUrl ? <img src={trademarkUrl} alt="Broker trademark" className="upload-card__preview" /> : <div className="upload-card__placeholder">No trademark uploaded</div>}
              <input type="file" accept="image/*" onChange={(event) => handleAssetUpload("trademark", event.target.files?.[0])} />
              <small>{uploading === "trademark" ? "Uploading..." : "Upload mark or seal"}</small>
            </label>
          </div>
        </section>
      </div>
    </section>
  );
}
