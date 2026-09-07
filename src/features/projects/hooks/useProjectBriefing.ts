import { useState, useCallback } from 'react';
import { Project, Profile } from '../../../types';
import { generateProjectBriefing, ProjectBriefingData } from '../utils/projectCalendar';

export function useProjectBriefing(profile: Profile) {
    const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
    const [briefingProject, setBriefingProject] = useState<Project | null>(null);
    const [briefingData, setBriefingData] = useState<ProjectBriefingData>({
        text: '',
        whatsappLink: '',
        googleCalendarLink: '',
        icsDataUri: ''
    });

    const handleOpenBriefingModal = useCallback((project: Project) => {
        setBriefingProject(project);
        const data = generateProjectBriefing(project, profile);
        setBriefingData(data);
        setIsBriefingModalOpen(true);
    }, [profile]);

    const handleCloseBriefingModal = useCallback(() => {
        setIsBriefingModalOpen(false);
        setBriefingProject(null);
    }, []);

    return {
        isBriefingModalOpen,
        briefingProject,
        briefingData,
        handleOpenBriefingModal,
        handleCloseBriefingModal
    };
}
