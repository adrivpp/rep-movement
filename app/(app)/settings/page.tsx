export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:px-12">
      <p className="micro-label">SETTINGS</p>
      <h1 className="mt-4 text-5xl font-medium sm:text-7xl">REP.MOVEMENT</h1>
      <div className="mt-12 grid gap-8 border-y border-[#ded6ca] py-10 sm:grid-cols-2">
        <label>
          <span className="micro-label">BRAND</span>
          <input className="field mt-2" defaultValue="REP.MOVEMENT" readOnly />
        </label>
        <label>
          <span className="micro-label">ROLE</span>
          <input className="field mt-2" defaultValue="Admin" readOnly />
        </label>
      </div>
    </div>
  );
}
