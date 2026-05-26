"use client";

import { useEffect, useMemo, useState } from "react";

const MEDIA_ACCEPT = ".mp4,.webm,.mov,.m4v,.jpg,.jpeg,.png,.webp,.gif";

const HELP_STEPS = [
  {
    number: "01",
    title: "Strategy",
    body: "We read the brand, audience, offer, and platform before a single asset is made.",
  },
  {
    number: "02",
    title: "Concept",
    body: "Hooks, story angles, visual direction, and campaign ideas are shaped for attention.",
  },
  {
    number: "03",
    title: "AI production",
    body: "We use AI systems and human taste to create videos, images, and campaign assets.",
  },
  {
    number: "04",
    title: "Delivery",
    body: "Ready-to-post content is organized for reels, ads, social, and brand launches.",
  },
  {
    number: "05",
    title: "Performance",
    body: "The work is built to be tested, promoted, and improved across campaigns.",
  },
];

const STUDIO_MARKERS = ["Werbens archive", "AI content studio", "Mumbai - worldwide"];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function pluralize(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function toCategorySlug(value) {
  return String(value || "")
    .trim()
    .replace(/&/g, "and")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSlug(value) {
  return toCategorySlug(value).toLowerCase();
}

function getPortfolioUrl(categoryName) {
  if (typeof window === "undefined") return "/portfolio";
  const match = window.location.pathname.match(/^(.*)\/portfolio(?:\/.*)?$/);
  const basePath = match?.[1] || "";
  const baseUrl = `${basePath}/portfolio`;
  return categoryName ? `${baseUrl}/${toCategorySlug(categoryName)}` : baseUrl;
}

function attachMediaUrls(catalog, apiBase) {
  const categories = Array.isArray(catalog?.categories) ? catalog.categories : [];

  return {
    ...catalog,
    categories: categories.map((category) => ({
      ...category,
      items: Array.isArray(category.items)
        ? category.items.map((item) => ({
            ...item,
            mediaUrl: item.mediaPath ? `${apiBase}${item.mediaPath}` : item.mediaUrl,
          }))
        : [],
    })),
  };
}

function getAllPortfolioItems(categories) {
  return categories.flatMap((category) =>
    (category.items || []).map((item) => ({
      ...item,
      categoryName: category.name,
    }))
  );
}

function getAdminHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function readApiError(response) {
  try {
    const data = await response.json();
    return data.error || data.message || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  return response.json();
}

function AdminButton({ children, className, variant = "primary", ...props }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 focus-ring",
        variant === "primary" && "bg-werbens-dark-cyan text-white hover:bg-werbens-steel",
        variant === "secondary" &&
          "border border-werbens-dark-cyan/15 bg-white text-werbens-text hover:border-werbens-dark-cyan/35 hover:text-werbens-dark-cyan",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function PasswordModal({ busy, error, onClose, onSubmit }) {
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-werbens-midnight/55 px-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(password);
        }}
        className="w-full max-w-sm rounded-lg border border-werbens-dark-cyan/10 bg-white p-6 shadow-2xl shadow-werbens-midnight/20"
      >
        <div className="mb-5">
          <h2 className="font-display text-2xl font-bold text-werbens-text">Admin access</h2>
          <p className="mt-1 text-sm text-werbens-muted">Enter the portfolio admin password.</p>
        </div>

        <label className="block text-sm font-semibold text-werbens-text" htmlFor="portfolio-admin-password">
          Password
        </label>
        <input
          id="portfolio-admin-password"
          autoFocus
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-werbens-dark-cyan/15 px-3 py-2 text-sm outline-none transition-colors focus:border-werbens-dark-cyan"
          placeholder="Enter password"
        />

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <AdminButton variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" disabled={busy || !password.trim()}>
            {busy ? "Checking..." : "Unlock"}
          </AdminButton>
        </div>
      </form>
    </div>
  );
}

function AdminPanel({
  apiBase,
  categories,
  onCatalogUpdate,
  onExit,
  setNotice,
  token,
}) {
  const [categoryName, setCategoryName] = useState("");
  const [uploadCategory, setUploadCategory] = useState(categories[0]?.name || "");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadInputKey, setUploadInputKey] = useState(0);
  const [busyAction, setBusyAction] = useState("");
  const [draggedCategoryId, setDraggedCategoryId] = useState("");

  useEffect(() => {
    if (!uploadCategory && categories[0]?.name) {
      setUploadCategory(categories[0].name);
    }
  }, [categories, uploadCategory]);

  async function createCategory() {
    const name = categoryName.trim();
    if (!name) return;

    setBusyAction("category");
    setNotice("");
    try {
      const data = await requestJson(`${apiBase}/api/portfolio/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(token),
        },
        body: JSON.stringify({ name }),
      });
      onCatalogUpdate(data.catalog);
      setUploadCategory(name);
      setCategoryName("");
      setNotice(`Created category "${name}".`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyAction("");
    }
  }

  async function uploadMedia() {
    if (!uploadCategory || uploadFiles.length === 0) return;

    const formData = new FormData();
    formData.append("category", uploadCategory);
    uploadFiles.forEach((file) => formData.append("files", file));

    setBusyAction("upload");
    setNotice("");
    try {
      const data = await requestJson(`${apiBase}/api/portfolio/admin/media`, {
        method: "POST",
        headers: getAdminHeaders(token),
        body: formData,
      });
      onCatalogUpdate(data.catalog);
      setUploadFiles([]);
      setUploadInputKey((key) => key + 1);
      setNotice(`Uploaded ${pluralize(data.uploaded?.length || 0, "file")}.`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyAction("");
    }
  }

  async function moveCategory(category, direction) {
    setBusyAction(`move-${category.name}`);
    setNotice("");
    try {
      const data = await requestJson(`${apiBase}/api/portfolio/admin/categories/order`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(token),
        },
        body: JSON.stringify({ category: category.name, direction }),
      });
      onCatalogUpdate(data.catalog);
      setNotice(`Moved "${category.name}" ${direction}.`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyAction("");
    }
  }

  async function saveCategoryOrder(orderedCategories) {
    setBusyAction("order");
    setNotice("");
    try {
      const data = await requestJson(`${apiBase}/api/portfolio/admin/categories/order`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(token),
        },
        body: JSON.stringify({ order: orderedCategories.map((category) => category.name) }),
      });
      onCatalogUpdate(data.catalog);
      setNotice("Section order updated.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyAction("");
    }
  }

  function handleCategoryDrop(targetCategory) {
    const draggedIndex = categories.findIndex((category) => category.id === draggedCategoryId);
    const targetIndex = categories.findIndex((category) => category.id === targetCategory.id);
    setDraggedCategoryId("");

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const nextCategories = [...categories];
    const [draggedCategory] = nextCategories.splice(draggedIndex, 1);
    nextCategories.splice(targetIndex, 0, draggedCategory);
    saveCategoryOrder(nextCategories);
  }

  return (
    <section id="portfolio-admin-tools" className="scroll-mt-36 border-b border-werbens-dark-cyan/10 bg-werbens-surface">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 rounded-lg border border-werbens-dark-cyan/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-werbens-text">Portfolio admin tools</h2>
            <p className="text-sm text-werbens-muted">Create categories, upload media, and reorder sections.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-werbens-dark-cyan">Admin mode</span>
        </div>

        <div className="rounded-lg border border-werbens-dark-cyan/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-werbens-text">Section order</h2>
            <span className="text-xs font-medium text-werbens-muted">Changes affect public order</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => (
              <div
                key={category.id}
                draggable={busyAction !== "order"}
                onDragStart={(event) => {
                  setDraggedCategoryId(category.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", category.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDragEnd={() => setDraggedCategoryId("")}
                onDrop={(event) => {
                  event.preventDefault();
                  handleCategoryDrop(category);
                }}
                className={cx(
                  "flex cursor-grab items-center justify-between gap-3 rounded-lg border border-werbens-dark-cyan/10 bg-werbens-mist px-3 py-2 transition active:cursor-grabbing",
                  draggedCategoryId === category.id && "opacity-45",
                  busyAction === "order" && "cursor-wait opacity-70"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-lg leading-none text-werbens-dark-cyan/45" aria-hidden="true">
                    ::
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-werbens-text">{category.name}</p>
                    <p className="text-xs text-werbens-muted">{pluralize(category.itemCount || 0, "asset")}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <AdminButton
                    variant="secondary"
                    className="min-h-8 px-2 py-1 text-xs"
                    disabled={index === 0 || busyAction === "order" || busyAction === `move-${category.name}`}
                    onClick={() => moveCategory(category, "up")}
                  >
                    Up
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="min-h-8 px-2 py-1 text-xs"
                    disabled={index === categories.length - 1 || busyAction === "order" || busyAction === `move-${category.name}`}
                    onClick={() => moveCategory(category, "down")}
                  >
                    Down
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
        <div>
          <label className="block text-sm font-semibold text-werbens-text" htmlFor="new-portfolio-category">
            New category
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="new-portfolio-category"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className="min-h-10 w-full rounded-lg border border-werbens-dark-cyan/15 bg-white px-3 text-sm outline-none focus:border-werbens-dark-cyan"
              placeholder="Category name"
            />
            <AdminButton onClick={createCategory} disabled={busyAction === "category" || !categoryName.trim()}>
              Create
            </AdminButton>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-werbens-text" htmlFor="portfolio-upload-category">
            Upload media
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
            <select
              id="portfolio-upload-category"
              value={uploadCategory}
              onChange={(event) => setUploadCategory(event.target.value)}
              className="min-h-10 rounded-lg border border-werbens-dark-cyan/15 bg-white px-3 text-sm outline-none focus:border-werbens-dark-cyan"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              key={uploadInputKey}
              type="file"
              multiple
              accept={MEDIA_ACCEPT}
              onChange={(event) => setUploadFiles(Array.from(event.target.files || []))}
              className="min-h-10 rounded-lg border border-werbens-dark-cyan/15 bg-white px-3 py-2 text-sm"
            />
            <AdminButton
              onClick={uploadMedia}
              disabled={busyAction === "upload" || !uploadCategory || uploadFiles.length === 0}
            >
              {busyAction === "upload" ? "Uploading..." : "Upload"}
            </AdminButton>
          </div>
        </div>

        <AdminButton variant="secondary" onClick={onExit}>
          Exit admin
        </AdminButton>
        </div>
      </div>
    </section>
  );
}

function PortfolioItemCard({
  admin,
  apiBase,
  categories,
  item,
  onCatalogUpdate,
  priority,
  setNotice,
  token,
}) {
  const [hasError, setHasError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fileName, setFileName] = useState(item.fileName);
  const [targetCategory, setTargetCategory] = useState(item.category);
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    setFileName(item.fileName);
    setTargetCategory(item.category);
    setHasError(false);
  }, [item.fileName, item.category, item.mediaUrl]);

  const extension = String(item.extension || item.type || "media").toUpperCase();
  const isVideo = item.type === "video";
  const encodedCategory = encodeURIComponent(item.category);
  const encodedFile = encodeURIComponent(item.fileName);

  async function deleteItem() {
    const confirmed = window.confirm(`Delete "${item.fileName}" from ${item.category}? This removes it from disk.`);
    if (!confirmed) return;

    setBusyAction("delete");
    setNotice("");
    try {
      const data = await requestJson(
        `${apiBase}/api/portfolio/admin/media/${encodedCategory}/${encodedFile}`,
        {
          method: "DELETE",
          headers: getAdminHeaders(token),
        }
      );
      onCatalogUpdate(data.catalog);
      setNotice("Media deleted.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyAction("");
    }
  }

  async function saveChanges() {
    setBusyAction("save");
    setNotice("");
    try {
      const data = await requestJson(
        `${apiBase}/api/portfolio/admin/media/${encodedCategory}/${encodedFile}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAdminHeaders(token),
          },
          body: JSON.stringify({
            category: targetCategory,
            fileName,
          }),
        }
      );
      onCatalogUpdate(data.catalog);
      setEditing(false);
      setNotice("Media updated.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyAction("");
    }
  }

  async function replaceMedia(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setBusyAction("replace");
    setNotice("");
    try {
      const data = await requestJson(
        `${apiBase}/api/portfolio/admin/media/${encodedCategory}/${encodedFile}/replace`,
        {
          method: "POST",
          headers: getAdminHeaders(token),
          body: formData,
        }
      );
      onCatalogUpdate(data.catalog);
      setNotice("Media replaced.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyAction("");
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-werbens-light-cyan/12 bg-[#07111f] shadow-2xl shadow-black/25 transition-transform duration-300 hover:-translate-y-1 hover:border-werbens-glow/35">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-werbens-glow/60 to-transparent" />
      <div className="relative aspect-[9/16] overflow-hidden bg-werbens-midnight">
        {isVideo && (
          <video
            aria-label={item.title}
            className="h-full w-full bg-werbens-midnight object-contain"
            controls
            playsInline
            preload={item.thumbnailUrl ? "none" : "metadata"}
            poster={item.thumbnailUrl || undefined}
            src={item.mediaUrl}
            onPlay={(event) => {
              document.querySelectorAll("video").forEach((video) => {
                if (video !== event.currentTarget) {
                  video.pause();
                }
              });
            }}
            onError={() => setHasError(true)}
          />
        )}

        {!isVideo && (
          <img
            alt={item.title}
            className="h-full w-full bg-werbens-midnight object-contain"
            decoding="async"
            loading={priority ? "eager" : "lazy"}
            src={item.mediaUrl}
            onError={() => setHasError(true)}
          />
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-werbens-midnight px-5 text-center text-sm font-medium text-white">
            Media unavailable
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-werbens-light-cyan/10 p-4">
        <p className="text-[0.65rem] font-semibold uppercase text-werbens-glow">
          {item.category}
        </p>
        <h3 className="truncate text-sm font-semibold text-white" title={item.title}>
          {item.title}
        </h3>
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <span className="rounded-full bg-werbens-glow/10 px-2.5 py-1 font-semibold text-werbens-light-cyan ring-1 ring-werbens-light-cyan/15">
            {extension}
          </span>
          <span>{item.formattedSize}</span>
        </div>

        {admin && (
          <div className="border-t border-werbens-light-cyan/10 pt-3">
            <div className="flex flex-wrap gap-2">
              <AdminButton variant="secondary" className="min-h-9 px-3 py-1.5 text-xs" onClick={() => setEditing((value) => !value)}>
                Edit
              </AdminButton>
              <AdminButton
                variant="danger"
                className="min-h-9 px-3 py-1.5 text-xs"
                onClick={deleteItem}
                disabled={busyAction === "delete"}
              >
                {busyAction === "delete" ? "Deleting..." : "Delete"}
              </AdminButton>
            </div>

            {editing && (
              <div className="mt-3 space-y-3 rounded-xl border border-werbens-light-cyan/10 bg-werbens-midnight/80 p-3">
                <label className="block text-xs font-semibold text-white">
                  File name
                  <input
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-werbens-light-cyan/15 bg-white px-3 py-2 text-xs text-werbens-text outline-none focus:border-werbens-dark-cyan"
                  />
                </label>

                <label className="block text-xs font-semibold text-white">
                  Category
                  <select
                    value={targetCategory}
                    onChange={(event) => setTargetCategory(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-werbens-light-cyan/15 bg-white px-3 py-2 text-xs text-werbens-text outline-none focus:border-werbens-dark-cyan"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-white">
                  Replace file
                  <input
                    type="file"
                    accept={MEDIA_ACCEPT}
                    disabled={busyAction === "replace"}
                    onChange={(event) => {
                      const replacement = event.target.files?.[0];
                      event.target.value = "";
                      replaceMedia(replacement);
                    }}
                    className="mt-1 w-full rounded-lg border border-werbens-light-cyan/15 bg-white px-3 py-2 text-xs text-werbens-text"
                  />
                </label>

                <div className="flex gap-2">
                  <AdminButton className="min-h-9 px-3 py-1.5 text-xs" onClick={saveChanges} disabled={busyAction === "save"}>
                    {busyAction === "save" ? "Saving..." : "Save"}
                  </AdminButton>
                  <AdminButton variant="secondary" className="min-h-9 px-3 py-1.5 text-xs" onClick={() => setEditing(false)}>
                    Cancel
                  </AdminButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function EditorialHeading({ eyebrow, title, children }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase text-werbens-glow">{eyebrow}</p>
      <h2
        className="max-w-3xl text-4xl font-semibold leading-[0.95] text-white sm:text-5xl lg:text-6xl"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: 0 }}
      >
        {title}
      </h2>
      {children && <div className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{children}</div>}
    </div>
  );
}

function HeroMediaStage({ categories, featuredItem }) {
  const posterUrl =
    featuredItem?.thumbnailUrl || (featuredItem?.type === "image" ? featuredItem.mediaUrl : "");

  return (
    <div className="relative h-[26rem] overflow-hidden rounded-[2rem] border border-werbens-light-cyan/15 bg-[#081321] p-3 shadow-2xl shadow-black/40 lg:h-[34rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(92,224,210,0.23),transparent_34%),linear-gradient(135deg,rgba(127,231,220,0.08),transparent_42%)]" />
      <div className="hero-grid absolute inset-0 opacity-35" />
      <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-white/8 bg-werbens-midnight">
        {posterUrl ? (
          <img
            alt={featuredItem?.title || "Werbens featured work"}
            className="h-full w-full object-cover opacity-80"
            decoding="async"
            loading="eager"
            src={posterUrl}
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute left-[14%] top-[18%] h-44 w-44 rounded-full border border-werbens-glow/25" />
            <div className="absolute right-[12%] top-[12%] h-52 w-52 rounded-full bg-werbens-glow/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
        <div className="absolute left-5 top-5 rounded-full border border-werbens-light-cyan/20 bg-black/35 px-3 py-1 text-xs font-semibold text-werbens-light-cyan backdrop-blur">
          Featured reel
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs font-semibold uppercase text-werbens-glow">
            {featuredItem?.categoryName || categories[0]?.name || "Werbens archive"}
          </p>
          <h3 className="mt-2 max-w-xl text-2xl font-semibold text-white sm:text-3xl">
            {featuredItem?.categoryName ? `Selected work from ${featuredItem.categoryName}` : "Creative systems for brand stories"}
          </h3>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-werbens-glow text-lg font-bold text-werbens-midnight shadow-lg shadow-werbens-glow/25">
              ▶
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Browse the archive</p>
              <p className="text-xs text-slate-400">Videos stay playable in the sections below.</p>
            </div>
          </div>
        </div>
        <div className="absolute right-4 top-4 hidden w-32 space-y-2 lg:block">
          {categories.slice(0, 4).map((category, index) => (
            <div
              key={category.id}
              className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-right backdrop-blur"
            >
              <p className="text-xs text-werbens-glow">0{index + 1}</p>
              <p className="truncate text-xs font-semibold text-white">{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudioStory({ totalItems, categories }) {
  return (
    <section id="about-us" className="border-y border-werbens-light-cyan/10 bg-[#081321]/80">
      <div className="mx-auto grid max-w-7xl gap-0 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.4fr] lg:px-8">
        <div className="border-b border-werbens-light-cyan/10 py-10 lg:border-b-0 lg:border-r lg:pr-10">
          <EditorialHeading eyebrow="About us" title="We're Werbens. A creative AI content studio.">
            <p>
              We fuse strategy, AI production, and human creative direction to turn brand ideas into
              scroll-stopping films, images, reels, and campaign assets.
            </p>
          </EditorialHeading>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-werbens-light-cyan/10 bg-white/5 p-4">
              <p className="text-3xl font-bold text-white">{totalItems}</p>
              <p className="mt-1 text-xs text-slate-400">Assets</p>
            </div>
            <div className="rounded-2xl border border-werbens-light-cyan/10 bg-white/5 p-4">
              <p className="text-3xl font-bold text-white">{categories.length}</p>
              <p className="mt-1 text-xs text-slate-400">Categories</p>
            </div>
            <div className="rounded-2xl border border-werbens-light-cyan/10 bg-white/5 p-4">
              <p className="text-3xl font-bold text-white">01</p>
              <p className="mt-1 text-xs text-slate-400">Studio</p>
            </div>
          </div>
        </div>

        <div id="how-we-help" className="py-10 lg:pl-10">
          <p className="mb-8 text-xs font-semibold uppercase text-werbens-glow">How we help brands</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {HELP_STEPS.map((step, index) => (
              <div key={step.number} className="relative rounded-2xl border border-werbens-light-cyan/10 bg-white/[0.04] p-4">
                {index < HELP_STEPS.length - 1 && (
                  <span className="absolute right-[-1.25rem] top-7 hidden h-px w-8 bg-werbens-light-cyan/25 xl:block" />
                )}
                <p className="text-2xl text-werbens-light-cyan">{step.number}</p>
                <h3 className="mt-5 text-sm font-bold uppercase text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryButton({ category, active, onClick, index }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group relative flex min-w-[9rem] shrink-0 flex-col items-start gap-3 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-colors focus-ring",
        active
          ? "border-werbens-glow bg-werbens-glow/12 text-white"
          : "border-werbens-light-cyan/10 bg-white/[0.04] text-slate-300 hover:border-werbens-light-cyan/30 hover:text-white"
      )}
    >
      <span className="text-xs text-werbens-glow">{index === 0 ? "00" : String(index).padStart(2, "0")}</span>
      <span className="relative z-10 text-base font-semibold leading-tight">{category.name}</span>
      <span
        className={cx(
          "relative z-10 rounded-full px-2 py-0.5 text-xs",
          active ? "bg-werbens-glow text-werbens-midnight" : "bg-werbens-light-cyan/10 text-werbens-light-cyan"
        )}
      >
        {pluralize(category.itemCount || 0, "asset")}
      </span>
      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-werbens-glow opacity-0 transition-opacity group-hover:opacity-80" />
    </button>
  );
}

export function PortfolioGallery({ apiBase, catalog, error, initialCategorySlug = "" }) {
  const [catalogState, setCatalogState] = useState(() => attachMediaUrls(catalog, apiBase));
  const [activeCategory, setActiveCategory] = useState(() => {
    const categories = Array.isArray(catalog?.categories) ? catalog.categories : [];
    const matchedCategory = categories.find(
      (category) => normalizeSlug(category.name) === normalizeSlug(initialCategorySlug)
    );
    return matchedCategory?.id || "all";
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const categories = useMemo(
    () => (Array.isArray(catalogState?.categories) ? catalogState.categories : []),
    [catalogState]
  );

  const visibleCategories = useMemo(() => {
    if (activeCategory === "all") return categories;
    return categories.filter((category) => category.id === activeCategory);
  }, [activeCategory, categories]);

  const totalItems = Number(catalogState?.totalItems || 0);
  const isAdmin = Boolean(adminToken);
  const allItems = useMemo(() => getAllPortfolioItems(categories), [categories]);
  const featuredItem = useMemo(
    () => allItems.find((item) => item.type === "video") || allItems[0],
    [allItems]
  );

  function updateCatalog(nextCatalog) {
    const hydratedCatalog = attachMediaUrls(nextCatalog, apiBase);
    setCatalogState(hydratedCatalog);

    const nextCategories = Array.isArray(hydratedCatalog.categories) ? hydratedCatalog.categories : [];
    if (activeCategory !== "all" && !nextCategories.some((category) => category.id === activeCategory)) {
      setActiveCategory("all");
      window.history.replaceState(null, "", getPortfolioUrl(""));
    }
  }

  async function unlockAdmin(password) {
    setAuthBusy(true);
    setAuthError("");
    setNotice("");
    try {
      const login = await requestJson(`${apiBase}/api/portfolio/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const adminCatalog = await requestJson(`${apiBase}/api/portfolio?includeEmpty=1`, {
        headers: getAdminHeaders(login.token),
      });
      setAdminToken(login.token);
      updateCatalog(adminCatalog);
      setShowPasswordModal(false);
      setNotice("Admin mode unlocked.");
    } catch (loginError) {
      setAuthError(loginError.message);
    } finally {
      setAuthBusy(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    window.requestAnimationFrame(() => {
      document.getElementById("portfolio-admin-tools")?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!initialCategorySlug || activeCategory !== "all") return;
    const matchedCategory = categories.find(
      (category) => normalizeSlug(category.name) === normalizeSlug(initialCategorySlug)
    );
    if (matchedCategory) {
      setActiveCategory(matchedCategory.id);
    }
  }, [activeCategory, categories, initialCategorySlug]);

  const handleCategoryChange = (categoryId, categoryName = "") => {
    setActiveCategory(categoryId);
    window.history.pushState(null, "", getPortfolioUrl(categoryId === "all" ? "" : categoryName));
    window.requestAnimationFrame(() => {
      if (categoryId === "all") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      document.getElementById(`portfolio-${categoryId}`)?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#050b12] text-white">
      <section className="relative overflow-hidden border-b border-werbens-light-cyan/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(92,224,210,0.16),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(49,104,121,0.22),transparent_32%),linear-gradient(180deg,#07111f_0%,#050b12_100%)]" />
        <div className="hero-grid absolute inset-0 opacity-30" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.25fr] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <div className="mb-8 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase text-werbens-glow">
                {STUDIO_MARKERS.map((marker) => (
                  <span key={marker} className="rounded-full border border-werbens-light-cyan/15 px-3 py-1">
                    {marker}
                  </span>
                ))}
              </div>

              <p className="mb-3 text-sm font-semibold text-werbens-glow">Werbens / Portfolio</p>
              <h1
                className="max-w-3xl text-5xl font-semibold leading-[0.9] text-white sm:text-6xl lg:text-7xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: 0 }}
              >
                Stories that <span className="text-werbens-light-cyan">move</span> brands.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                Category-wise creative work across ads, hospitality, education, fashion, food,
                personal brands, home decor, and more.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  document.getElementById("portfolio-archive")?.scrollIntoView({
                    block: "start",
                    behavior: "smooth",
                  });
                }}
                className="group inline-flex items-center gap-4 rounded-full border border-werbens-glow/40 bg-werbens-glow/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-werbens-glow/20 focus-ring"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-werbens-glow text-werbens-midnight">
                  ▶
                </span>
                Browse work
              </button>
              <a
                href="mailto:hello@werbens.com"
                className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-5 text-sm font-bold text-white transition hover:border-werbens-light-cyan/45 focus-ring"
              >
                Contact Werbens
              </a>
              <AdminButton
                variant={isAdmin ? "secondary" : "primary"}
                className="min-h-12 rounded-full px-5"
                onClick={() => {
                  if (isAdmin) {
                    setAdminToken("");
                    setNotice("Admin mode closed.");
                    return;
                  }
                  setShowPasswordModal(true);
                }}
              >
                {isAdmin ? "Admin on" : "Edit"}
              </AdminButton>
            </div>
          </div>

          <HeroMediaStage categories={categories} featuredItem={featuredItem} />
        </div>
      </section>

      <StudioStory totalItems={totalItems} categories={categories} />

      {isAdmin && (
        <AdminPanel
          apiBase={apiBase}
          categories={categories}
          onCatalogUpdate={updateCatalog}
          onExit={() => {
            setAdminToken("");
            setNotice("Admin mode closed.");
          }}
          setNotice={setNotice}
          token={adminToken}
        />
      )}

      <section id="portfolio-archive" className="sticky top-[6.75rem] z-20 border-y border-werbens-light-cyan/10 bg-[#050b12]/92 backdrop-blur-xl sm:top-[7.5rem]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <nav className="-mx-5 flex gap-3 overflow-x-auto px-5 py-4 sm:-mx-6 sm:px-6" aria-label="Portfolio categories">
            <CategoryButton
              category={{ id: "all", name: "All work", itemCount: totalItems }}
              active={activeCategory === "all"}
              index={0}
              onClick={() => handleCategoryChange("all")}
            />
            {categories.map((category, index) => (
              <CategoryButton
                key={category.id}
                category={category}
                active={activeCategory === category.id}
                index={index + 1}
                onClick={() => handleCategoryChange(category.id, category.name)}
              />
            ))}
          </nav>
        </div>
      </section>

      {showPasswordModal && (
        <PasswordModal
          busy={authBusy}
          error={authError}
          onClose={() => {
            setShowPasswordModal(false);
            setAuthError("");
          }}
          onSubmit={unlockAdmin}
        />
      )}

      {(error || notice) && (
        <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-6 lg:px-8">
          <div
            className={cx(
              "rounded-2xl border px-4 py-3 text-sm font-medium",
              error
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-werbens-light-cyan/15 bg-white/[0.06] text-werbens-light-cyan"
            )}
          >
            {error || notice}
          </div>
        </div>
      )}

      {!error && categories.length === 0 && (
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-werbens-light-cyan/10 bg-white/[0.04] p-8 text-center text-slate-400">
            No portfolio media found.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-12 sm:px-6 lg:px-8">
        {visibleCategories.map((category, categoryIndex) => (
          <section
            key={category.id}
            id={`portfolio-${category.id}`}
            className="scroll-mt-52"
          >
            <div className="mb-6 grid gap-4 border-b border-werbens-light-cyan/10 pb-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-werbens-glow">
                  {String(categoryIndex + 1).padStart(2, "0")} / Featured work
                </p>
                <h2
                  className="text-4xl font-semibold leading-none text-white sm:text-5xl"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: 0 }}
                >
                  {category.name}
                </h2>
                <p className="mt-3 text-sm text-slate-400">
                  {pluralize(category.videoCount || 0, "video")} / {pluralize(category.imageCount || 0, "image")}
                </p>
              </div>
              <div className="text-sm font-semibold text-werbens-light-cyan">
                {pluralize(category.itemCount || 0, "asset")}
              </div>
            </div>

            {category.itemCount === 0 ? (
              <div className="rounded-2xl border border-dashed border-werbens-light-cyan/20 bg-white/[0.04] px-5 py-8 text-center text-sm text-slate-400">
                This category is empty. Upload media from admin mode.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(category.items || []).map((item, itemIndex) => (
                  <PortfolioItemCard
                    key={item.id}
                    admin={isAdmin}
                    apiBase={apiBase}
                    categories={categories}
                    item={item}
                    onCatalogUpdate={updateCatalog}
                    priority={categoryIndex === 0 && itemIndex < 6}
                    setNotice={setNotice}
                    token={adminToken}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="border-t border-werbens-light-cyan/10 px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-werbens-light-cyan/15 bg-gradient-to-br from-werbens-glow/14 via-white/[0.04] to-werbens-dark-cyan/20 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase text-werbens-glow">Start a project</p>
            <h2
              className="text-4xl font-semibold leading-none text-white sm:text-5xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: 0 }}
            >
              Let's build your brand story.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Have a project in mind? Werbens can help turn it into ready-to-post creative work.
            </p>
          </div>
          <a
            href="mailto:hello@werbens.com"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-werbens-glow/35 bg-werbens-glow px-6 text-sm font-bold text-werbens-midnight transition hover:bg-werbens-light-cyan focus-ring"
          >
            Get in touch
          </a>
        </div>
      </section>
    </main>
  );
}
