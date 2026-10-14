import { useState } from "react";

import { categories } from "./store";

const emptySupplier = {
  name: "",

  contact: "",

  email: "",

  phone: "",

  category: categories[0],
};

function getSupplierId(supplier) {
  return String(supplier._id ?? supplier.id ?? "");
}

// Products and orders store the numeric supplierId, not MongoDB _id.
function getSupplierReference(supplier) {
  return String(supplier.supplierId ?? "");
}

function getErrorMessage(error, fallback) {
  const message = error.response?.data?.message;

  if (error.response?.data?.code === 11000 || error.response?.status === 409) {
    return message || "Supplier conflict. Check its email or linked records.";
  }

  return message || error.message || fallback;
}

export default function SuppliersMongoPage({
  suppliers = [],

  products = [],

  orders = [],

  onAdd,

  onUpdate,

  onDelete,

  loading = false,
}) {
  const [form, setForm] = useState({ ...emptySupplier });

  const [editingId, setEditingId] = useState(null);

  const [errors, setErrors] = useState({});

  const [notice, setNotice] = useState("");

  const [noticeType, setNoticeType] = useState("success");

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [confirmId, setConfirmId] = useState(null);

  const busy = saving || deletingId !== null || loading;

  const sortedSuppliers = [...suppliers].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  function showNotice(message, type = "success") {
    setNotice(message);

    setNoticeType(type);
  }

  function change(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,

      [name]: "",
    }));

    setNotice("");
  }

  function resetForm() {
    setForm({ ...emptySupplier });

    setEditingId(null);

    setErrors({});
  }

  function validate() {
    const nextErrors = {};

    const name = form.name.trim();

    const contact = form.contact.trim();

    const email = form.email.trim().toLowerCase();

    const phone = form.phone.trim();

    if (!name) {
      nextErrors.name = "Enter a supplier name.";
    } else if (name.length < 2) {
      nextErrors.name = "Use at least 2 characters.";
    } else if (name.length > 100) {
      nextErrors.name = "Use 100 characters or fewer.";
    }

    if (contact.length > 100) {
      nextErrors.contact = "Use 100 characters or fewer.";
    }

    if (!email) {
      nextErrors.email = "Enter a contact email.";
    } else if (email.length > 160) {
      nextErrors.email = "Email must be 160 characters or fewer.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    const duplicate = suppliers.some((supplier) => {
      const supplierId = getSupplierId(supplier);

      const supplierEmail = String(supplier.email || "")
        .trim()
        .toLowerCase();

      return supplierId !== String(editingId ?? "") && supplierEmail === email;
    });

    if (email && duplicate) {
      nextErrors.email = "This email is already in use.";
    }

    if (phone) {
      const validCharacters = /^\+?[\d\s().-]+$/.test(phone);

      const digits = phone.replace(/\D/g, "");

      if (!validCharacters || digits.length < 7 || digits.length > 15) {
        nextErrors.phone = "Enter a valid phone number.";
      }
    }

    if (!categories.includes(form.category)) {
      nextErrors.category = "Choose a valid category.";
    }

    return nextErrors;
  }

  async function submit(event) {
    event.preventDefault();

    if (busy) return;

    const nextErrors = validate();

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      name: form.name.trim(),

      contact: form.contact.trim(),

      email: form.email.trim().toLowerCase(),

      phone: form.phone.trim(),

      category: form.category,
    };

    setSaving(true);

    setNotice("");

    try {
      if (editingId !== null) {
        await onUpdate(editingId, payload);

        showNotice("Supplier updated successfully.");
      } else {
        await onAdd(payload);

        showNotice("Supplier added successfully.");
      }

      resetForm();

      setConfirmId(null);
    } catch (error) {
      showNotice(
        getErrorMessage(error, "Unable to save supplier."),

        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function editSupplier(supplier) {
    if (busy) return;

    setEditingId(getSupplierId(supplier));

    setForm({
      name: supplier.name || "",

      contact: supplier.contact || "",

      email: supplier.email || "",

      phone: supplier.phone || "",

      category: supplier.category || categories[0],
    });

    setConfirmId(null);

    setErrors({});

    setNotice("");

    window.scrollTo({
      top: 0,

      behavior: "smooth",
    });
  }

  function getLinkedProducts(supplier) {
    const reference = getSupplierReference(supplier);
    if (!reference) return [];
    return products.filter(
      (product) => String(product.supplierId ?? "") === reference,
    );
  }

  function getLinkedOrders(supplier) {
    const reference = getSupplierReference(supplier);
    if (!reference) return [];
    return orders.filter(
      (order) => String(order.supplierId ?? "") === reference,
    );
  }

  async function removeSupplier(supplier) {
    if (busy) return;

    const supplierId = getSupplierId(supplier);

    const linkedProducts = getLinkedProducts(supplier);

    const pendingOrders = getLinkedOrders(supplier).filter(
      (order) => order.status === "Pending",
    );

    if (linkedProducts.length || pendingOrders.length) {
      showNotice(
        `Cannot delete ${supplier.name}. It has ` +
          `${linkedProducts.length} linked product(s) and ` +
          `${pendingOrders.length} pending order(s).`,

        "error",
      );

      setConfirmId(null);

      return;
    }

    if (confirmId !== supplierId) {
      setConfirmId(supplierId);

      showNotice("Click Remove again to confirm.");

      return;
    }

    setDeletingId(supplierId);

    setNotice("");

    try {
      await onDelete(supplierId);

      showNotice(`${supplier.name} deleted successfully.`);

      setConfirmId(null);

      if (String(editingId) === supplierId) {
        resetForm();
      }
    } catch (error) {
      showNotice(
        getErrorMessage(error, "Unable to delete supplier."),

        "error",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Suppliers</h1>

          <p>Maintain supplier contacts and the products they provide.</p>
        </div>
      </header>

      {notice && (
        <div
          className={`inline-notice ${
            noticeType === "error" ? "error-notice" : "success-notice"
          }`}
          role={noticeType === "error" ? "alert" : "status"}
        >
          {notice}
        </div>
      )}

      <form
        id="supplier-form"
        className="panel add-form"
        onSubmit={submit}
        noValidate
      >
        <div className="panel-heading">
          <div>
            <h2>{editingId !== null ? "Edit supplier" : "Add supplier"}</h2>

            <p>Supplier contact information</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="supplier-name">Supplier name</label>

            <input
              id="supplier-name"
              name="name"
              value={form.name}
              onChange={change}
              maxLength={100}
              placeholder="Supplier name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "supplier-name-error" : undefined}
              disabled={busy}
            />

            {errors.name && (
              <span className="field-error" id="supplier-name-error">
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="supplier-contact">Contact person</label>

            <input
              id="supplier-contact"
              name="contact"
              value={form.contact}
              onChange={change}
              maxLength={100}
              placeholder="Contact person"
              aria-invalid={Boolean(errors.contact)}
              aria-describedby={
                errors.contact ? "supplier-contact-error" : undefined
              }
              disabled={busy}
            />

            {errors.contact && (
              <span className="field-error" id="supplier-contact-error">
                {errors.contact}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="supplier-email">Email</label>

            <input
              id="supplier-email"
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              maxLength={160}
              placeholder="supplier@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "supplier-email-error" : undefined
              }
              disabled={busy}
            />

            {errors.email && (
              <span className="field-error" id="supplier-email-error">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="supplier-phone">Phone</label>

            <input
              id="supplier-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={change}
              maxLength={30}
              placeholder="+63 912 345 6789"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? "supplier-phone-error" : undefined
              }
              disabled={busy}
            />

            {errors.phone && (
              <span className="field-error" id="supplier-phone-error">
                {errors.phone}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="supplier-category">Primary category</label>

            <select
              id="supplier-category"
              name="category"
              value={form.category}
              onChange={change}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={
                errors.category ? "supplier-category-error" : undefined
              }
              disabled={busy}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {errors.category && (
              <span className="field-error" id="supplier-category-error">
                {errors.category}
              </span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            className="primary-button save-button"
            type="submit"
            disabled={busy}
          >
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Save supplier"
                : "Add supplier"}
          </button>

          {editingId !== null && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                resetForm();

                setNotice("");
              }}
              disabled={busy}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section className="panel list-panel">
        <div className="panel-heading">
          <div>
            <h2>Supplier directory</h2>

            <p>{suppliers.length} suppliers</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading suppliers from MongoDB...</div>
        ) : sortedSuppliers.length === 0 ? (
          <div className="empty-state">
            <strong>No suppliers yet</strong>

            <span>Add your first supplier above.</span>
          </div>
        ) : (
          <div className="supplier-grid">
            {sortedSuppliers.map((supplier) => {
              const supplierId = getSupplierId(supplier);

              const linkedProducts = getLinkedProducts(supplier);

              const linkedOrders = getLinkedOrders(supplier);

              const pendingOrders = linkedOrders.filter(
                (order) => order.status === "Pending",
              );

              const protectedSupplier =
                linkedProducts.length > 0 || pendingOrders.length > 0;

              const initials = supplier.name

                .trim()

                .split(/\s+/)

                .slice(0, 2)

                .map((word) => word[0])

                .join("")

                .toUpperCase();

              return (
                <article className="supplier-card" key={supplierId}>
                  <div className="supplier-avatar">{initials}</div>

                  <div className="supplier-card-main">
                    <h3>{supplier.name}</h3>

                    <p>{supplier.contact || "No contact person"}</p>

                    <a href={`mailto:${supplier.email}`}>{supplier.email}</a>

                    <p>
                      {supplier.phone || "No phone number"}

                      {" · "}

                      {supplier.category}
                    </p>
                  </div>

                  <div className="supplier-card-stats">
                    <strong>{linkedProducts.length}</strong>

                    <span>products</span>

                    <strong>{linkedOrders.length}</strong>

                    <span>orders</span>
                  </div>

                  <div className="supplier-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => editSupplier(supplier)}
                      disabled={busy}
                    >
                      Edit
                    </button>

                    <button
                      className={`secondary-button remove-button${
                        confirmId === supplierId ? " confirming" : ""
                      }`}
                      type="button"
                      disabled={busy || protectedSupplier}
                      title={
                        protectedSupplier
                          ? "Reassign products and close pending orders first."
                          : undefined
                      }
                      onClick={() => removeSupplier(supplier)}
                    >
                      {deletingId === supplierId
                        ? "Removing..."
                        : confirmId === supplierId
                          ? "Confirm remove"
                          : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
