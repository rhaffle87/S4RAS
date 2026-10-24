import React from 'react';
import { 
  GraduationCap, FolderGit2, FolderArchive, FolderKanban, ExternalLink, 
  Server, Database, Network, ArrowRight, Terminal, BookOpen 
} from 'lucide-react';
import { useKeycloak } from '../context/KeycloakContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

const COURSES = [
  {
    id: 2,
    code: 'KOM-401',
    titleId: 'Komputasi Awan (Cloud Computing)',
    titleEn: 'Cloud Computing & Distributed Systems',
    instructor: 'Dr. Hendra Wijaya',
    icon: Server,
    color: 'from-rose-500/15 to-red-500/10 border-rose-500/30 text-rose-400',
    linkColor: 'text-rose-300 group-hover:text-rose-200',
    url: 'https://moodle.s4ras.site/course/view.php?id=2',
  },
  {
    id: 3,
    code: 'SBD-201',
    titleId: 'Sistem Basis Data (Database Systems)',
    titleEn: 'Advanced Database Systems',
    instructor: 'Dr. Hendra Wijaya',
    icon: Database,
    color: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    linkColor: 'text-emerald-300 group-hover:text-emerald-200',
    url: 'https://moodle.s4ras.site/course/view.php?id=3',
  },
  {
    id: 4,
    code: 'JK-302',
    titleId: 'Jaringan Komputer Lanjut (Computer Networks)',
    titleEn: 'Advanced Computer Networks',
    instructor: 'Dr. Hendra Wijaya',
    icon: Network,
    color: 'from-purple-500/15 to-pink-500/10 border-purple-500/30 text-purple-400',
    linkColor: 'text-purple-300 group-hover:text-purple-200',
    url: 'https://moodle.s4ras.site/course/view.php?id=4',
  },
];

const SAN_FOLDERS = [
  {
    name: 'Materi_Kuliah',
    descKey: 'academic.folder_materials',
    countNum: 12,
    countTypeKey: 'academic.count_files',
    icon: FolderArchive,
  },
  {
    name: 'Tugas_Mahasiswa',
    descKey: 'academic.folder_assignments',
    countNum: 4,
    countTypeKey: 'academic.count_dirs',
    icon: FolderKanban,
  },
  {
    name: 'Riset_Laboratorium',
    descKey: 'academic.folder_research',
    countNum: 8,
    countTypeKey: 'academic.count_files',
    icon: FolderGit2,
  },
];

export default function AcademicHubCard() {
  const { persona } = useKeycloak();
  const { t, language } = useThemeLanguage();

  const PersonaIcon = persona === 'teacher' ? BookOpen : persona === 'dev' ? Terminal : GraduationCap;

  const personaStatus = persona === 'teacher'
    ? t('academic.persona_teacher')
    : persona === 'dev'
    ? t('academic.persona_admin')
    : t('academic.persona_student');

  return (
    <div className="bg-neutral-bg2 border border-border-default rounded-2xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-4 border-b border-border-default/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand-light shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary m-0">
              {t('academic.hub_title')}
            </h2>
            <p className="text-xs text-text-secondary m-0">
              {t('academic.hub_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-brand-subtle text-brand-light font-semibold border border-brand/20 whitespace-nowrap">
            <PersonaIcon size={12} className="shrink-0" />
            <span>{personaStatus}</span>
          </span>
        </div>
      </div>

      {/* Courses Grid — Fluid 1-col mobile, 2-col tablet, 3-col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 mb-5 sm:mb-6">
        {COURSES.map((course) => {
          const Icon = course.icon;
          const courseTitle = language === 'en' ? course.titleEn : course.titleId;
          return (
            <a
              key={course.id}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3.5 sm:p-4 rounded-xl border bg-gradient-to-br ${course.color} transition-transform duration-200 ease-out hover:scale-[1.015] hover:shadow-md flex flex-col justify-between group min-h-[140px]`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/30 text-white">
                    {course.code}
                  </span>
                  <ExternalLink size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-bold text-text-primary m-0 mb-1 group-hover:text-white transition-colors line-clamp-2">
                  {courseTitle}
                </h3>
                <p className="text-xs text-text-secondary m-0">
                  {t('academic.instructor')}: {course.instructor}
                </p>
              </div>

              <div className="mt-3.5 sm:mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-medium text-text-secondary">
                <span className="flex items-center gap-1.5 truncate">
                  <Icon size={13} className="shrink-0" />
                  <span className="truncate">Moodle #{course.id}</span>
                </span>
                <span className={`${course.linkColor} font-semibold flex items-center gap-1 group-hover:underline transition-colors shrink-0`}>
                  <span>{t('academic.open_course')}</span>
                  <ArrowRight size={11} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Nextcloud Storage Quick Access */}
      <div className="bg-neutral-bg1 rounded-xl p-3.5 sm:p-4 border border-border-default/60">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderGit2 size={16} className="text-brand-light shrink-0" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider m-0 truncate">
              {t('academic.san_title')}
            </h4>
          </div>
          <a
            href="https://cloud.s4ras.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-light hover:underline flex items-center gap-1 font-semibold shrink-0"
          >
            <span>{t('academic.open_cloud')}</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          {SAN_FOLDERS.map((f) => {
            const FolderIcon = f.icon;
            return (
              <a
                key={f.name}
                href="https://cloud.s4ras.site"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-3 rounded-xl bg-neutral-bg2 hover:bg-neutral-bg3 border border-border-default/80 hover:border-brand/40 flex items-center justify-between gap-3 sm:gap-4 transition-colors duration-150 hover:shadow-sm group"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 text-brand-light group-hover:scale-105 transition-transform">
                    <FolderIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-primary m-0 group-hover:text-brand-light transition-colors truncate">
                      {f.name}
                    </p>
                    <p className="text-[11px] text-text-secondary m-0 truncate">
                      {t(f.descKey)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <span className="whitespace-nowrap text-[10px] text-text-secondary font-mono bg-neutral-bg1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-border-default">
                    {f.countNum} {t(f.countTypeKey)}
                  </span>
                  <ExternalLink size={13} className="text-text-secondary opacity-40 group-hover:opacity-100 group-hover:text-brand-light transition-all" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
