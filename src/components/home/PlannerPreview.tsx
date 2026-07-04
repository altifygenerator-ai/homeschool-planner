import {
  LuArchive,
  LuBookOpen,
  LuCheck,
  LuChevronDown,
  LuLeaf,
  LuMessageSquareText,
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
          <span className="pill">Moveable cards</span>
          <span className="pill pill-gold">Beta account saving</span>
        </div>

        <div className="activity-row">
          <div className="activity-dot">
            <LuBookOpen />
          </div>

          <div>
            <p className="activity-title">Read chapter 4 together</p>
            <p className="activity-meta">Reading · Morning · Emma</p>

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
            <p className="activity-title">Swimming / movement time</p>
            <p className="activity-meta">Mon · Wed · Fri · Everyone</p>

            <div className="pill-row" style={{ marginTop: "0.65rem" }}>
              <span className="pill pill-gold">Multi-day</span>
              <span className="pill">Added once</span>
            </div>
          </div>
        </div>

        <div className="summary-box">
          <p className="summary-label">
            <LuArchive style={{ display: "inline", marginRight: "0.35rem" }} />
            Saved week idea
          </p>
          <p className="summary-text">
            Save the week and get a simple child rundown based on what was
            planned, moved, skipped, completed, and noted.
          </p>
        </div>

        <div className="activity-row">
          <div className="activity-dot">
            <LuLeaf />
          </div>

          <div>
            <p className="activity-title">Nature walk + leaf sketching</p>
            <p className="activity-meta">Nature · Afternoon · Everyone</p>

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

        <div className="summary-box feedback-summary-box">
          <p className="summary-label">
            <LuMessageSquareText
              style={{ display: "inline", marginRight: "0.35rem" }}
            />
            What testers are helping shape
          </p>
          <p className="summary-text">
            The planner flow, multi-day activities, saved weeks, child records,
            and whether the whole thing feels calm enough to actually use.
          </p>
        </div>
      </div>
    </div>
  );
}