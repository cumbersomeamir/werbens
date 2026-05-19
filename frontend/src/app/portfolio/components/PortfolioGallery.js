"use client";

import { useEffect, useMemo, useState } from "react";

const MEDIA_ACCEPT = ".mp4,.webm,.mov,.m4v,.jpg,.jpeg,.png,.webp,.gif";
const INITIAL_ITEMS_PER_CATEGORY = 8;
const ITEMS_PER_BATCH = 8;

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
            mediaUrl: item.mediaUrl || `${apiBase}${item.mediaPath || ""}`,
          }))
        : [],
    })),
  };
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

  return (
    <section className="border-b border-werbens-dark-cyan/10 bg-werbens-surface">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-werbens-dark-cyan/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-werbens-text">Section order</h2>
            <span className="text-xs font-medium text-werbens-muted">Changes affect public order</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-werbens-dark-cyan/10 bg-werbens-mist px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-werbens-text">{category.name}</p>
                  <p className="text-xs text-werbens-muted">{pluralize(category.itemCount || 0, "asset")}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <AdminButton
                    variant="secondary"
                    className="min-h-8 px-2 py-1 text-xs"
                    disabled={index === 0 || busyAction === `move-${category.name}`}
                    onClick={() => moveCategory(category, "up")}
                  >
                    Up
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="min-h-8 px-2 py-1 text-xs"
                    disabled={index === categories.length - 1 || busyAction === `move-${category.name}`}
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
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);
  const [editing, setEditing] = useState(false);
  const [fileName, setFileName] = useState(item.fileName);
  const [targetCategory, setTargetCategory] = useState(item.category);
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    setFileName(item.fileName);
    setTargetCategory(item.category);
    setHasError(false);
    setIsVideoActive(false);
    setLoadPercent(0);
  }, [item.fileName, item.category, item.mediaUrl]);

  const extension = String(item.extension || item.type || "media").toUpperCase();
  const isVideo = item.type === "video";
  const encodedCategory = encodeURIComponent(item.category);
  const encodedFile = encodeURIComponent(item.fileName);

  function updateVideoProgress(video) {
    if (!video?.duration || !Number.isFinite(video.duration) || video.buffered.length === 0) return;
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    setLoadPercent(Math.min(100, Math.round((bufferedEnd / video.duration) * 100)));
  }

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
    <article className="group overflow-hidden rounded-lg border border-werbens-dark-cyan/10 bg-white shadow-sm shadow-werbens-dark-cyan/5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-werbens-dark-cyan/10">
      <div className="relative aspect-[9/16] overflow-hidden bg-werbens-midnight">
        {isVideo && !isVideoActive && !hasError && (
          <button
            type="button"
            className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-werbens-midnight text-center text-white transition-colors hover:bg-werbens-deep focus-ring"
            onClick={() => setIsVideoActive(true)}
            aria-label={`Load ${item.title}`}
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-werbens-midnight shadow-lg">
              Play
            </span>
            <span className="px-5 text-sm font-semibold">Tap to load video</span>
            <span className="mt-2 px-5 text-xs text-white/55">Loads only when opened</span>
          </button>
        )}

        {isVideo && isVideoActive && (
          <video
            aria-label={item.title}
            className="h-full w-full bg-werbens-midnight object-contain"
            controls
            playsInline
            preload="none"
            src={item.mediaUrl}
            onLoadedMetadata={(event) => updateVideoProgress(event.currentTarget)}
            onProgress={(event) => updateVideoProgress(event.currentTarget)}
            onCanPlay={(event) => {
              updateVideoProgress(event.currentTarget);
              setLoadPercent(100);
            }}
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

        {isVideo && isVideoActive && loadPercent < 100 && !hasError && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-werbens-midnight/75 px-2.5 py-1 text-xs font-semibold text-white">
            {loadPercent || 1}%
          </div>
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

      <div className="space-y-3 p-4">
        <h3 className="truncate text-sm font-semibold text-werbens-text" title={item.title}>
          {item.title}
        </h3>
        <div className="flex items-center justify-between gap-3 text-xs text-werbens-muted">
          <span className="rounded-md bg-werbens-cloud px-2 py-1 font-semibold text-werbens-dark-cyan">
            {extension}
          </span>
          <span>{item.formattedSize}</span>
        </div>

        {admin && (
          <div className="border-t border-werbens-dark-cyan/10 pt-3">
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
              <div className="mt-3 space-y-3 rounded-lg bg-werbens-mist p-3">
                <label className="block text-xs font-semibold text-werbens-text">
                  File name
                  <input
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-werbens-dark-cyan/15 bg-white px-3 py-2 text-xs outline-none focus:border-werbens-dark-cyan"
                  />
                </label>

                <label className="block text-xs font-semibold text-werbens-text">
                  Category
                  <select
                    value={targetCategory}
                    onChange={(event) => setTargetCategory(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-werbens-dark-cyan/15 bg-white px-3 py-2 text-xs outline-none focus:border-werbens-dark-cyan"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-werbens-text">
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
                    className="mt-1 w-full rounded-lg border border-werbens-dark-cyan/15 bg-white px-3 py-2 text-xs"
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

function CategoryButton({ category, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-ring",
        active
          ? "border-werbens-dark-cyan bg-werbens-dark-cyan text-white"
          : "border-werbens-dark-cyan/12 bg-white text-werbens-text hover:border-werbens-dark-cyan/30 hover:text-werbens-dark-cyan"
      )}
    >
      <span>{category.name}</span>
      <span
        className={cx(
          "rounded-md px-2 py-0.5 text-xs",
          active ? "bg-white/15 text-white" : "bg-werbens-cloud text-werbens-dark-cyan"
        )}
      >
        {category.itemCount}
      </span>
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
  const [visibleLimits, setVisibleLimits] = useState({});

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

  function getVisibleLimit(category) {
    return visibleLimits[category.id] || INITIAL_ITEMS_PER_CATEGORY;
  }

  function showMoreItems(category) {
    setVisibleLimits((limits) => ({
      ...limits,
      [category.id]: (limits[category.id] || INITIAL_ITEMS_PER_CATEGORY) + ITEMS_PER_BATCH,
    }));
  }

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
    <main className="min-h-screen bg-gradient-to-b from-werbens-mist via-white to-white">
      <section className="border-b border-werbens-dark-cyan/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-5 py-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-werbens-dark-cyan">Werbens work</p>
            <h1 className="font-display text-4xl font-bold text-werbens-text sm:text-5xl">
              Portfolio
            </h1>
          </div>

          <AdminButton
            variant={isAdmin ? "secondary" : "primary"}
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
      </section>

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

      <section className="sticky top-[6.75rem] z-20 border-b border-werbens-dark-cyan/10 bg-white/95 backdrop-blur sm:top-[7.5rem]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <nav className="-mx-5 flex gap-2 overflow-x-auto px-5 py-4 sm:-mx-6 sm:px-6" aria-label="Portfolio categories">
            <CategoryButton
              category={{ id: "all", name: "All", itemCount: totalItems }}
              active={activeCategory === "all"}
              onClick={() => handleCategoryChange("all")}
            />
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                active={activeCategory === category.id}
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
              "rounded-lg border px-4 py-3 text-sm font-medium",
              error
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-werbens-dark-cyan/15 bg-white text-werbens-dark-cyan"
            )}
          >
            {error || notice}
          </div>
        </div>
      )}

      {!error && categories.length === 0 && (
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-werbens-dark-cyan/10 bg-white p-8 text-center text-werbens-muted">
            No portfolio media found.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-14 px-5 py-10 sm:px-6 lg:px-8">
        {visibleCategories.map((category, categoryIndex) => (
          <section
            key={category.id}
            id={`portfolio-${category.id}`}
            className="scroll-mt-48"
          >
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-werbens-text sm:text-3xl">
                  {category.name}
                </h2>
                <p className="mt-1 text-sm text-werbens-muted">
                  {pluralize(category.videoCount || 0, "video")} / {pluralize(category.imageCount || 0, "image")}
                </p>
              </div>
              <div className="text-sm font-semibold text-werbens-dark-cyan">
                {pluralize(category.itemCount || 0, "asset")}
              </div>
            </div>

            {category.itemCount === 0 ? (
              <div className="rounded-lg border border-dashed border-werbens-dark-cyan/20 bg-white px-5 py-8 text-center text-sm text-werbens-muted">
                This category is empty. Upload media from admin mode.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(category.items || []).slice(0, getVisibleLimit(category)).map((item, itemIndex) => (
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

                {getVisibleLimit(category) < (category.items || []).length && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => showMoreItems(category)}
                      className="min-h-11 rounded-lg border border-werbens-dark-cyan/20 bg-white px-5 text-sm font-semibold text-werbens-dark-cyan transition-colors hover:border-werbens-dark-cyan hover:bg-werbens-cloud focus-ring"
                    >
                      Show more {Math.min(ITEMS_PER_BATCH, (category.items || []).length - getVisibleLimit(category))} assets
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
