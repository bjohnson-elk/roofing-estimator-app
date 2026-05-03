import PlaceholderPage from "@/components/PlaceholderPage";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      active="Settings"
      description="This section will eventually manage pricing, labor rates, templates, packages, warranties, users, roles, and company defaults."
      currentWorkaround="For now, settings are handled directly in Supabase tables and the app code."
    />
  );
}