import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { brokerApi } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import SectionTabs from "../../components/SectionTabs";
import CustomerKycPreview from "../../components/kyc/CustomerKycPreview";
import { downloadCustomerKycPdf } from "../../utils/kycPdf";
import { resolveAssetUrl } from "../../utils/assets";

const initialForm = {
  fullName: "",
  clientCode: "",
  phone: "",
  email: "",
  address: "",
};

const initialKycForm = {
  firstName: "",
  lastName: "",
  fatherName: "",
  phone: "",
  email: "",
  address: "",
  dateOfBirth: "",
  gender: "",
  applicationDate: new Date().toISOString().slice(0, 10),
  initialDeposit: "",
  aadhaarNumber: "",
  panNumber: "",
};

const documentFields = [
  { key: "customerPhoto", label: "Customer photo", previewKey: "customerPhotoUrl" },
  { key: "customerSignature", label: "Customer signature", previewKey: "customerSignatureUrl" },
  { key: "aadhaarFront", label: "Aadhaar front", previewKey: "aadhaarFrontUrl" },
  { key: "aadhaarBack", label: "Aadhaar back", previewKey: "aadhaarBackUrl" },
  { key: "panImage", label: "PAN card", previewKey: "panImageUrl" },
];

function splitFullName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function CustomerForm({ form, setForm, saving, onSubmit, onCancel, isEditing }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>
        Full name
        <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
      </label>
      <label>
        Client code
        <input value={form.clientCode} onChange={(event) => setForm({ ...form, clientCode: event.target.value.toUpperCase() })} required />
      </label>
      <label>
        Mobile
        <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      </label>
      <label className="form-grid__span-2">
        Address
        <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} rows="3" />
      </label>

      <div className="form-actions-row form-grid__span-2">
        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : isEditing ? "Update customer" : "Create customer"}
        </button>
        {isEditing ? (
          <button className="btn btn--ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function buildKycFormFromCustomer(customer) {
  const kyc = customer?.kyc || {};
  const fallbackNames = splitFullName(customer?.fullName || "");

  return {
    firstName: kyc.firstName || fallbackNames.firstName || "",
    lastName: kyc.lastName || fallbackNames.lastName || "",
    fatherName: kyc.fatherName || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    dateOfBirth: kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toISOString().slice(0, 10) : "",
    gender: kyc.gender || "",
    applicationDate: kyc.applicationDate ? new Date(kyc.applicationDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    initialDeposit: kyc.initialDeposit ?? "",
    aadhaarNumber: kyc.aadhaarNumber || "",
    panNumber: kyc.panNumber || "",
  };
}

export default function BrokerCustomersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [kycForm, setKycForm] = useState(initialKycForm);
  const [editingCustomerId, setEditingCustomerId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [kycPreview, setKycPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [generatingKyc, setGeneratingKyc] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("list");

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer._id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await brokerApi.get("/api/broker-portal/clients");
      setCustomers(response.data);
      setError("");

      if (!response.data.length) {
        setSelectedCustomerId("");
        setKycPreview(null);
        if (!editingCustomerId) {
          setActiveTab("create");
        }
        return;
      }

      if (!selectedCustomerId || !response.data.some((customer) => customer._id === selectedCustomerId)) {
        setSelectedCustomerId(response.data[0]._id);
      }
    } catch (requestError) {
      setCustomers([]);
      setError(requestError.response?.data?.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, [editingCustomerId, selectedCustomerId]);

  const loadKycPreview = useCallback(async (clientId) => {
    if (!clientId) {
      setKycPreview(null);
      return null;
    }

    try {
      const response = await brokerApi.get(`/api/broker-portal/clients/${clientId}/kyc-preview`);
      setKycPreview(response.data);
      return response.data;
    } catch (requestError) {
      setKycPreview(null);
      setError(requestError.response?.data?.message || "Unable to load KYC preview.");
      return null;
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const requestedTab = location.state?.activeTab;
    if (!requestedTab) {
      return;
    }

    setActiveTab(requestedTab);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (activeTab === "edit" && !editingCustomerId) {
      setActiveTab(customers.length ? "list" : "create");
    }
  }, [activeTab, customers.length, editingCustomerId]);

  useEffect(() => {
    if (activeTab === "kyc" && !selectedCustomerId) {
      setActiveTab(customers.length ? "list" : "create");
    }
  }, [activeTab, customers.length, selectedCustomerId]);

  useEffect(() => {
    if (!selectedCustomer) {
      setKycForm(initialKycForm);
      setKycPreview(null);
      return;
    }

    setKycForm(buildKycFormFromCustomer(selectedCustomer));

    if (activeTab === "kyc") {
      loadKycPreview(selectedCustomer._id);
    }
  }, [activeTab, loadKycPreview, selectedCustomer]);

  const tabs = useMemo(
    () => [
      { key: "list", label: "List", badge: customers.length },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit", disabled: !editingCustomerId },
      { key: "kyc", label: "KYC", disabled: !selectedCustomerId },
    ],
    [customers.length, editingCustomerId, selectedCustomerId]
  );

  function resetForm() {
    setForm(initialForm);
    setEditingCustomerId("");
    setActiveTab(customers.length ? "list" : "create");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      idCode: form.clientCode,
      clientCode: form.clientCode,
    };

    try {
      let savedCustomer;
      if (editingCustomerId) {
        const response = await brokerApi.patch(`/api/broker-portal/clients/${editingCustomerId}`, payload);
        savedCustomer = response.data;
        setMessage("Customer updated.");
      } else {
        const response = await brokerApi.post("/api/broker-portal/clients", payload);
        savedCustomer = response.data;
        setMessage("Customer created.");
      }

      setSelectedCustomerId(savedCustomer._id);
      resetForm();
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save customer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveKyc(event) {
    event.preventDefault();
    if (!selectedCustomerId) {
      return;
    }

    setSavingKyc(true);
    setError("");
    setMessage("");

    try {
      await brokerApi.patch(`/api/broker-portal/clients/${selectedCustomerId}`, {
        fullName: `${kycForm.firstName} ${kycForm.lastName}`.trim(),
        phone: kycForm.phone,
        email: kycForm.email,
        address: kycForm.address,
        kyc: {
          firstName: kycForm.firstName,
          lastName: kycForm.lastName,
          fatherName: kycForm.fatherName,
          dateOfBirth: kycForm.dateOfBirth,
          gender: kycForm.gender,
          applicationDate: kycForm.applicationDate,
          initialDeposit: Number(kycForm.initialDeposit || 0),
          aadhaarNumber: kycForm.aadhaarNumber,
          panNumber: kycForm.panNumber,
        },
      });

      await loadCustomers();
      await loadKycPreview(selectedCustomerId);
      setMessage("KYC details saved.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save KYC details.");
    } finally {
      setSavingKyc(false);
    }
  }

  async function handleGenerateKyc() {
    if (!selectedCustomerId) {
      return;
    }

    setGeneratingKyc(true);
    setError("");
    setMessage("");

    try {
      const response = await brokerApi.post(`/api/broker-portal/clients/${selectedCustomerId}/generate-kyc`);
      setKycPreview(response.data);
      await loadCustomers();
      setMessage("KYC form generated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate KYC form.");
    } finally {
      setGeneratingKyc(false);
    }
  }

  async function handleUploadDocument(documentType, file) {
    if (!selectedCustomerId || !file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploadingDocument(documentType);
    setError("");
    setMessage("");

    try {
      await brokerApi.post(`/api/broker-portal/clients/${selectedCustomerId}/documents/${documentType}`, formData);
      await loadCustomers();
      await loadKycPreview(selectedCustomerId);
      setMessage("Document uploaded.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to upload document.");
    } finally {
      setUploadingDocument("");
    }
  }

  function startEdit(customer) {
    setEditingCustomerId(customer._id);
    setSelectedCustomerId(customer._id);
    setForm({
      fullName: customer.fullName || "",
      clientCode: customer.clientCode || customer.idCode || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setActiveTab("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openKyc(customer) {
    setSelectedCustomerId(customer._id);
    setActiveTab("kyc");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrintKyc() {
    if (!kycPreview) {
      return;
    }

    downloadCustomerKycPdf(kycPreview);
  }

  return (
    <section className="page-grid">
      <PageHeader title="Customers" />

      {error ? <div className="alert-strip">{error}</div> : null}
      {message ? <div className="alert-strip alert-strip--success">{message}</div> : null}

      <SectionTabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === "list" ? (
        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <h3>Customer list</h3>
            <span>{customers.length} total</span>
          </div>

          {loading ? <div>Loading...</div> : null}

          {!loading && !customers.length ? <EmptyState title="No customers" /> : null}

          {!loading && customers.length ? (
            <div className="mobile-entity-list">
              {customers.map((customer) => (
                <article key={customer._id} className={selectedCustomerId === customer._id ? "mobile-entity-card is-selected" : "mobile-entity-card"}>
                  <div className="mobile-entity-card__header">
                    <div>
                      <strong>{customer.fullName}</strong>
                      <span>{customer.clientCode || customer.idCode}</span>
                    </div>
                    <span className={`status-pill status-pill--${customer.kyc?.status === "generated" ? "closed" : customer.kyc?.status === "ready" ? "open" : "draft"}`}>{customer.kyc?.status || "incomplete"}</span>
                  </div>

                  <div className="mobile-entity-card__meta">
                    <div>
                      <span>Phone</span>
                      <strong>{customer.phone || "-"}</strong>
                    </div>
                    <div>
                      <span>Email</span>
                      <strong>{customer.email || "-"}</strong>
                    </div>
                    <div>
                      <span>KYC</span>
                      <strong>{customer.kyc?.referenceNumber || "Draft"}</strong>
                    </div>
                  </div>

                  {customer.address ? <p className="entity-note">{customer.address}</p> : null}

                  <div className="broker-card__actions broker-card__actions--wrap">
                    <button className="btn btn--ghost" type="button" onClick={() => startEdit(customer)}>
                      Edit
                    </button>
                    <button className="btn btn--primary" type="button" onClick={() => openKyc(customer)}>
                      KYC
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "create" ? (
        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <h3>Create customer</h3>
            <span>New record</span>
          </div>

          <CustomerForm
            form={form}
            setForm={setForm}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={false}
          />
        </section>
      ) : null}

      {activeTab === "edit" ? (
        <section className="panel panel--padded">
          <div className="panel__header panel__header--stack">
            <h3>Edit customer</h3>
            <span>{editingCustomerId ? "Update details" : "Select a customer"}</span>
          </div>

          {editingCustomerId ? (
            <CustomerForm
              form={form}
              setForm={setForm}
              saving={saving}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              isEditing
            />
          ) : (
            <EmptyState title="No customer selected" />
          )}
        </section>
      ) : null}

      {activeTab === "kyc" ? (
        <>
          {selectedCustomer ? (
            <>
              <section className="panel panel--padded no-print">
                <div className="panel__header panel__header--stack">
                  <h3>KYC details</h3>
                  <span>{selectedCustomer.fullName}</span>
                </div>

                <form className="page-grid" onSubmit={handleSaveKyc}>
                  <div className="kyc-section-card">
                    <h4>Identity</h4>
                    <div className="form-grid">
                      <label>
                        First name
                        <input value={kycForm.firstName} onChange={(event) => setKycForm({ ...kycForm, firstName: event.target.value })} />
                      </label>
                      <label>
                        Last name
                        <input value={kycForm.lastName} onChange={(event) => setKycForm({ ...kycForm, lastName: event.target.value })} />
                      </label>
                      <label>
                        Father's name
                        <input value={kycForm.fatherName} onChange={(event) => setKycForm({ ...kycForm, fatherName: event.target.value })} />
                      </label>
                      <label>
                        Mobile
                        <input value={kycForm.phone} onChange={(event) => setKycForm({ ...kycForm, phone: event.target.value })} />
                      </label>
                      <label>
                        Email
                        <input type="email" value={kycForm.email} onChange={(event) => setKycForm({ ...kycForm, email: event.target.value })} />
                      </label>
                      <label>
                        Date of birth
                        <input type="date" value={kycForm.dateOfBirth} onChange={(event) => setKycForm({ ...kycForm, dateOfBirth: event.target.value })} />
                      </label>
                      <label>
                        Gender
                        <select value={kycForm.gender} onChange={(event) => setKycForm({ ...kycForm, gender: event.target.value })}>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label>
                        Application date
                        <input type="date" value={kycForm.applicationDate} onChange={(event) => setKycForm({ ...kycForm, applicationDate: event.target.value })} />
                      </label>
                      <label>
                        Initial deposit (INR)
                        <input type="number" min="0" step="0.01" value={kycForm.initialDeposit} onChange={(event) => setKycForm({ ...kycForm, initialDeposit: event.target.value })} />
                      </label>
                      <label className="form-grid__span-2">
                        Address
                        <textarea value={kycForm.address} onChange={(event) => setKycForm({ ...kycForm, address: event.target.value })} rows="3" />
                      </label>
                    </div>
                  </div>

                  <div className="kyc-section-card">
                    <h4>Aadhaar & PAN</h4>
                    <div className="form-grid">
                      <label>
                        Aadhaar number
                        <input value={kycForm.aadhaarNumber} onChange={(event) => setKycForm({ ...kycForm, aadhaarNumber: event.target.value })} />
                      </label>
                      <label>
                        PAN number
                        <input value={kycForm.panNumber} onChange={(event) => setKycForm({ ...kycForm, panNumber: event.target.value.toUpperCase() })} />
                      </label>
                    </div>
                  </div>

                  <div className="kyc-section-card">
                    <h4>Uploads</h4>
                    <div className="upload-grid kyc-upload-grid">
                      {documentFields.map((field) => {
                        const previewValue = selectedCustomer.kyc?.[field.previewKey];
                        return (
                          <label key={field.key} className="upload-card">
                            <span>{field.label}</span>
                            {previewValue ? (
                              <img src={resolveAssetUrl(previewValue)} alt={field.label} className="upload-card__preview" />
                            ) : (
                              <div className="upload-card__placeholder">No file</div>
                            )}
                            <input type="file" accept="image/*" onChange={(event) => handleUploadDocument(field.key, event.target.files?.[0])} />
                            <small>{uploadingDocument === field.key ? "Uploading..." : "Upload image"}</small>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-actions-row">
                    <button className="btn btn--primary" type="submit" disabled={savingKyc}>
                      {savingKyc ? "Saving..." : "Save KYC"}
                    </button>
                    <button className="btn btn--ghost" type="button" onClick={handleGenerateKyc} disabled={generatingKyc}>
                      {generatingKyc ? "Generating..." : "Generate KYC Form"}
                    </button>
                    {kycPreview ? (
                      <button className="btn btn--ghost" type="button" onClick={handlePrintKyc}>
                        Download PDF
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>

              {kycPreview ? (
                <CustomerKycPreview broker={kycPreview.broker} client={kycPreview.client} />
              ) : (
                <EmptyState title="No KYC form" />
              )}
            </>
          ) : (
            <EmptyState title="No customer selected" />
          )}
        </>
      ) : null}
    </section>
  );
}
