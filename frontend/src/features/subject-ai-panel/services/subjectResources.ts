import { supabase } from "@/lib/supabase";

export type ResourceCategory =
  | "Lecture / Day wise"
  | "Unit wise"
  | "PYQ"
  | "Other";

export interface SubjectResourceItem {
  id: string;
  title: string;
  category: ResourceCategory;
  storagePath: string | null;
  sizeBytes?: number;
}

const mockSubjectMap: Record<string, string> = {
  dbms: "dbms",
  cs301: "dbms",
  cn: "cn",
  cs302: "cn",
  os: "os",
  cs303: "os",
  dsa: "dsa",
  cs201: "dsa",
  bee: "bee",
  ee101: "bee",
  eg: "eg",
  me102: "eg",
  daa: "daa",
  cs304: "daa",
  dm: "dm",
  ma202: "dm",
  epp: "epp",
  hs301: "epp",
};

const mockResourcesBySubject: Record<string, SubjectResourceItem[]> = {
  dbms: [
    {
      id: "dbms-lec-1",
      title: "Lecture 1 — Introduction to DBMS.pdf",
      category: "Lecture / Day wise",
      storagePath: "community/dbms/lec-1.pdf",
      sizeBytes: 1016315,
    },
    {
      id: "dbms-lec-2",
      title: "Lecture 2 — ER Modeling & Schema Design.pdf",
      category: "Lecture / Day wise",
      storagePath: "community/dbms/lec-2.pdf",
      sizeBytes: 852000,
    },
    {
      id: "dbms-unit-1",
      title: "Unit 1 — Relational Algebra & SQL Basics.pdf",
      category: "Unit wise",
      storagePath: "community/dbms/unit-1.pdf",
      sizeBytes: 1240000,
    },
    {
      id: "dbms-pyq-1",
      title: "2023 End Semester Examination.pdf",
      category: "PYQ",
      storagePath: "community/dbms/pyq-2023.pdf",
      sizeBytes: 420000,
    },
    {
      id: "dbms-other-1",
      title: "DBMS Lab Manual & SQL Exercises.pdf",
      category: "Other",
      storagePath: "community/dbms/lab-manual.pdf",
      sizeBytes: 1540000,
    },
  ],
  cn: [
    {
      id: "cn-lec-1",
      title: "Lecture 1 — OSI 7-Layer Reference Model.pdf",
      category: "Lecture / Day wise",
      storagePath: "community/cn/lec-1.pdf",
      sizeBytes: 940000,
    },
    {
      id: "cn-unit-1",
      title: "Unit 2 — Subnetting and CIDR Routing.pdf",
      category: "Unit wise",
      storagePath: "community/cn/unit-2.pdf",
      sizeBytes: 1120000,
    },
    {
      id: "cn-pyq-1",
      title: "2022 Mid Semester Exam.pdf",
      category: "PYQ",
      storagePath: "community/cn/pyq-2022.pdf",
      sizeBytes: 380000,
    },
    {
      id: "cn-other-1",
      title: "Packet Tracer Network Lab Setup Guide.pdf",
      category: "Other",
      storagePath: "community/cn/packet-tracer.pdf",
      sizeBytes: 1890000,
    },
  ],
  os: [
    {
      id: "os-lec-1",
      title: "Lecture 3 — Process Synchronization & Semaphores.pdf",
      category: "Lecture / Day wise",
      storagePath: "community/os/lec-3.pdf",
      sizeBytes: 980000,
    },
    {
      id: "os-unit-1",
      title: "Unit 3 — Virtual Memory & Page Replacement.pdf",
      category: "Unit wise",
      storagePath: "community/os/unit-3.pdf",
      sizeBytes: 1350000,
    },
    {
      id: "os-pyq-1",
      title: "2021 End Semester Solutions.pdf",
      category: "PYQ",
      storagePath: "community/os/pyq-2021.pdf",
      sizeBytes: 510000,
    },
    {
      id: "os-other-1",
      title: "Linux Shell Scripting & Fork Cheat Sheet.pdf",
      category: "Other",
      storagePath: "community/os/shell-cheatsheet.pdf",
      sizeBytes: 670000,
    },
  ],
  dsa: [
    {
      id: "dsa-lec-1",
      title: "Lecture 4 — Balanced Binary Search Trees (AVL/Red-Black).pdf",
      category: "Lecture / Day wise",
      storagePath: "community/dsa/lec-4.pdf",
      sizeBytes: 1420000,
    },
    {
      id: "dsa-unit-1",
      title: "Unit 4 — Graph Algorithms (Dijkstra, Bellman-Ford).pdf",
      category: "Unit wise",
      storagePath: "community/dsa/unit-4.pdf",
      sizeBytes: 1180000,
    },
    {
      id: "dsa-pyq-1",
      title: "2023 Mid Term PYQ.pdf",
      category: "PYQ",
      storagePath: "community/dsa/pyq-2023.pdf",
      sizeBytes: 440000,
    },
    {
      id: "dsa-other-1",
      title: "Asymptotic Notation Reference & Master Theorem.pdf",
      category: "Other",
      storagePath: "community/dsa/asymptotics.pdf",
      sizeBytes: 780000,
    },
  ],
};

const isMock = import.meta.env.VITE_USE_MOCKS !== "false";

export async function fetchSubjectResources(
  subjectId: string,
): Promise<SubjectResourceItem[]> {
  if (isMock) {
    const canonicalKey =
      mockSubjectMap[subjectId.toLowerCase()] ?? subjectId.toLowerCase();
    const found = mockResourcesBySubject[canonicalKey];
    if (found) return found;

    // Fallback mock items for any other subject
    return [
      {
        id: `${subjectId}-lec-1`,
        title: `Curriculum Overview & Lecture Notes.pdf`,
        category: "Lecture / Day wise",
        storagePath: `community/${subjectId}/overview.pdf`,
        sizeBytes: 1016315,
      },
      {
        id: `${subjectId}-unit-1`,
        title: `Unit 1 Reference Syllabus & Notes.pdf`,
        category: "Unit wise",
        storagePath: `community/${subjectId}/unit-1.pdf`,
        sizeBytes: 890000,
      },
      {
        id: `${subjectId}-pyq-1`,
        title: `Previous Year Questions (PYQs).pdf`,
        category: "PYQ",
        storagePath: `community/${subjectId}/pyq.pdf`,
        sizeBytes: 450000,
      },
    ];
  }

  // Real Supabase fetch
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, tag, storage_path, is_shared, status")
    .eq("subject_id", subjectId)
    .eq("is_shared", true)
    .eq("status", "approved")
    .in("tag", ["Lecture / Day wise", "Unit wise", "PYQ", "Other"]);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to fetch subject resources");
  }

  return data
    .filter((n) => Boolean(n.storage_path))
    .map((n) => ({
      id: n.id,
      title: n.title,
      category: n.tag as ResourceCategory,
      storagePath: n.storage_path,
    }));
}

export async function downloadResourceAsFile(
  resource: SubjectResourceItem,
): Promise<File> {
  let fileUrl = "/pdfjs/web/compressed.tracemonkey-pldi-09.pdf";

  if (!isMock) {
    if (!resource.storagePath) {
      throw new Error("Missing storage path for resource");
    }
    const signed = await supabase.storage
      .from("subject-notes")
      .createSignedUrl(resource.storagePath, 3600);

    if (signed.error || !signed.data?.signedUrl) {
      throw new Error(
        signed.error?.message ?? "Failed to generate document download link",
      );
    }
    fileUrl = signed.data.signedUrl;
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download resource "${resource.title}"`);
  }

  const blob = await response.blob();
  // Ensure the filename has .pdf extension if not already present
  const filename = resource.title.toLowerCase().endsWith(".pdf")
    ? resource.title
    : `${resource.title}.pdf`;

  return new File([blob], filename, {
    type: "application/pdf",
    lastModified: Date.now(),
  });
}
