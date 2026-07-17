import { SectionSubnav } from "./SectionSubnav.jsx";

/** Shared account settings ribbon for all roles (profile family). */
export function AccountSettingsNav({ navigate, active }) {
  const items = [
    { view: "profile", label: "Profile" },
    { view: "security", label: "Security" },
    { view: "settings/notifications", label: "Notifications" },
    { view: "settings/privacy", label: "Privacy" },
  ];
  return (
    <SectionSubnav
      ariaLabel="Account settings"
      navigate={navigate}
      active={active}
      items={items}
    />
  );
}
