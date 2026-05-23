import {
  LuBookOpen,
  LuCheck,
  LuChevronDown,
  LuLeaf,
  LuSoup,
  LuX,
} from "react-icons/lu";

export default function PlannerPreview() {
  return (
    <div className="planner-window">
      <div className="planner-topbar">
        <div className="window-dots">
          <span />
          <span />
          <span />
        </div>

        <p className="week-label">Soft weekly plan</p>
      </div>

      <div className="planner-content">
        <div className="pill-row">
          <span className="pill pill-sage">This week</span>
          <span className="pill">Flexible plans</span>
          <span className="pill pill-gold">Real-life notes</span>
        </div>

        <div className="activity-row">
          <div className="activity-dot">
            <LuBookOpen />
          </div>

          <div>
            <p className="activity-title">Read chapter 4 together</p>
            <p className="activity-meta">
              Reading · Morning
            </p>

            <div className="pill-row" style={{ marginTop: "0.65rem" }}>
              <span className="pill pill-sage">
                <LuCheck /> Done
              </span>
              <span className="pill">Move to Wed</span>
            </div>
          </div>
        </div>

        <div className="activity-row">
          <div className="activity-dot">
            <LuSoup />
          </div>

          <div>
            <p className="activity-title">Kitchen fractions</p>
            <p className="activity-meta">
              Life skills · Midday
            </p>

            <div className="pill-row" style={{ marginTop: "0.65rem" }}>
              <span className="pill pill-gold">Moved</span>
              <span className="pill">No pressure</span>
            </div>
          </div>
        </div>

        <div className="summary-box">
          <p className="summary-label">What actually happened</p>
          <p className="summary-text">
            We skipped the worksheet and practiced fractions while baking. Still
            counted. Still recorded. No need to restart the whole plan.
          </p>
        </div>

        <div className="activity-row">
          <div className="activity-dot">
            <LuLeaf />
          </div>

          <div>
            <p className="activity-title">Nature walk + leaf sketching</p>
            <p className="activity-meta">
              Nature · Afternoon
            </p>

            <div className="pill-row" style={{ marginTop: "0.65rem" }}>
              <span className="pill pill-sage">
                <LuCheck /> Done
              </span>
              <span className="pill pill-clay">
                <LuX /> Skip allowed
              </span>
              <span className="pill">
                <LuChevronDown /> Adjust
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}