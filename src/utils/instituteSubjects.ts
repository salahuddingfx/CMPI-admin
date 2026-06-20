export interface InstituteSubject {
  code: string;
  name: string;
}

export const instituteSubjectsBySemester: Record<string, InstituteSubject[]> = {
  "1st": [
    { code: "66741", name: "Mathematics-I" },
    { code: "66752", name: "Physics" },
    { code: "66753", name: "Chemistry" },
    { code: "66763", name: "English" },
    { code: "66773", name: "Bangladesh Studies" },
    { code: "66701", name: "Workshop Practice" },
    { code: "66702", name: "Computer Application" },
  ],
  "2nd": [
    { code: "66742", name: "Mathematics-II" },
    { code: "66711", name: "Electric & Electronic Circuit" },
    { code: "66712", name: "Digital Electronics" },
    { code: "66764", name: "Communication Skills" },
    { code: "66774", name: "Environmental Studies" },
    { code: "66703", name: "Programming in C" },
  ],
  "3rd": [
    { code: "66743", name: "Mathematics-III" },
    { code: "66713", name: "Electrical Machine-I" },
    { code: "66714", name: "Power System-I" },
    { code: "66715", name: "Instrumentation & Measurement" },
    { code: "66704", name: "Data Structure" },
    { code: "66705", name: "Assembly Language Programming" },
  ],
  "4th": [
    { code: "66744", name: "Mathematics-IV" },
    { code: "66716", name: "Electrical Machine-II" },
    { code: "66717", name: "Power System-II" },
    { code: "66718", name: "Control System" },
    { code: "66706", name: "Database Management" },
    { code: "66707", name: "Object Oriented Programming" },
  ],
  "5th": [
    { code: "66719", name: "Switchgear & Protection" },
    { code: "66720", name: "Utilization of Electrical Energy" },
    { code: "66721", name: "Industrial Drives" },
    { code: "66708", name: "Computer Network" },
    { code: "66709", name: "Web Technology" },
  ],
  "6th": [
    { code: "66722", name: "Power System-II" },
    { code: "66723", name: "High Voltage Engineering" },
    { code: "66724", name: "Electrical Design & Estimating" },
    { code: "66710", name: "Software Engineering" },
    { code: "66725", name: "Renewable Energy" },
  ],
  "7th": [
    { code: "66726", name: "Power Plant Engineering" },
    { code: "66727", name: "Industrial Control" },
    { code: "66728", name: "Management" },
    { code: "66729", name: "Project Work-I" },
  ],
  "8th": [
    { code: "66730", name: "Electrical Installation & Maintenance" },
    { code: "66731", name: "Professional Practice" },
    { code: "66732", name: "Project Work-II" },
    { code: "66733", name: "Industrial Attachment" },
  ],
};

export function getSubjectsForSemester(semester: string): InstituteSubject[] {
  return instituteSubjectsBySemester[semester] || [];
}

export const allSemesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
