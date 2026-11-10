
import TeamLanyardRail from "../ui/TeamLanyard";
import type { LanyardMember } from "../ui/TeamLanyard";

const teamMembers: LanyardMember[] = [
  {
    id: "member-1",
    name: "Baldovino, Charlize Mae S.",
    role: "Project Leader / IoT Developer",
    team: "SustansyaBox",
    image: "/team/member1.jpg",
    tone: 1,
    drop: 8,
    bio: "Leads the SustansyaBox project and contributes to the development and integration of its IoT hardware.",
    tags: ["Leadership", "IoT Development"],
  },
  {
    id: "member-2",
    name: "Calimlim, Shanell E.",
    role: "Creatives / IoT Developer",
    team: "SustansyaBox",
    image: "/team/member2.jpg",
    tone: 2,
    drop: 16,
    bio: "Handles creative contributions and collaborates on the development of SustansyaBox's IoT components.",
    tags: ["Creatives", "IoT Development"],
  },
  {
    id: "member-3",
    name: "Jance, Kathlyne Anne C.",
    role: "Backend Developer / IoT Developer",
    team: "SustansyaBox",
    image: "/team/member3.jpg",
    tone: 3,
    drop: 5,
    bio: "Develops backend functionality and contributes to the integration of the smart lunchbox's IoT system.",
    tags: ["Backend", "IoT Development"],
  },
  {
    id: "member-4",
    name: "Madriaga, Joshua R.",
    role: "Figma Designer / IoT Developer",
    team: "SustansyaBox",
    image: "/team/member4.jpg",
    tone: 4,
    drop: 12,
    bio: "Designs the application's interface in Figma and contributes to the development of the IoT hardware.",
    tags: ["Figma", "IoT Development"],
  },
  {
    id: "member-5",
    name: "Maneja, Angela Nicole S.",
    role: "Frontend Developer / IoT Developer",
    team: "SustansyaBox",
    image: "/team/member5.jpg",
    tone: 5,
    drop: 10,
    bio: "Develops the interactive frontend interface and contributes to the smart lunchbox's IoT integration.",
    tags: ["Frontend", "IoT Development"],
  },
];

export default function AboutUsPreview() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: 0,
        boxSizing: "border-box",
        background: "var(--bg)",
        color: "var(--text)",
        padding: "12px 24px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1300,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 3,
              color: "var(--primary)",
              margin: 0,
            }}
          >
            SUSTANSYABOX
          </p>

          <h1
            style={{
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.2,
              margin: "8px 0",
              color: "var(--text)",
            }}
          >
            Meet Our Team
          </h1>

          <p
            style={{
              color: "var(--muted)",
              fontSize: 14,
              margin: 0,
            }}
          >
            The people behind our smart nutrition lunchbox.
          </p>
        </header>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <TeamLanyardRail
            items={teamMembers}
            autoplay
            interval={3000}
            caption="Move your cursor across the cards, drag a lanyard, or click an ID to flip it."
          />
        </div>
      </div>
    </div>
  );
}
