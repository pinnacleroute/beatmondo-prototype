/**
 * Shared section ribbon for multi-view module families.
 * Use on list/section siblings; keep single back on true record detail pages.
 */
export function SectionSubnav({
  items = [],
  active,
  navigate,
  ariaLabel = "Section navigation",
  backTo = null,
  className = "",
}) {
  const visible = items.filter(Boolean);
  if (!visible.length && !backTo) return null;
  return (
    <div className={`bm-section-nav-wrap ${className}`.trim()}>
      {backTo && (
        <button
          type="button"
          className="bm-section-back"
          onClick={() =>
            typeof backTo.onClick === "function"
              ? backTo.onClick()
              : navigate(backTo.view)
          }
        >
          <span className="bm-section-back-arrow" aria-hidden="true">
            ←
          </span>
          {backTo.label}
        </button>
      )}
      {visible.length > 0 && (
        <nav className="bm-section-subnav" aria-label={ariaLabel}>
          {visible.map((item) => {
            const id = item.id || item.view;
            const isActive = active === id || active === item.view;
            return (
              <button
                key={id}
                type="button"
                className={isActive ? "active" : ""}
                aria-current={isActive ? "page" : undefined}
                onClick={() =>
                  typeof item.onClick === "function"
                    ? item.onClick()
                    : navigate(item.view)
                }
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
