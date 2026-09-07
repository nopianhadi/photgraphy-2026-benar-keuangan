import React from 'react';
import { SendIcon } from 'lucide-react';
import Modal from '../../../shared/ui/Modal';
import { Project } from '../../../types';
import { ProjectBriefingData } from '../utils/projectCalendar';

interface ProjectBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    briefingData: ProjectBriefingData;
}

export const ProjectBriefingModal: React.FC<ProjectBriefingModalProps> = ({
    isOpen,
    onClose,
    project,
    briefingData
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bagikan Briefing Acara Pernikahan" size="2xl">
            {project && (
                <div className="space-y-4">
                    <textarea
                        value={briefingData.text}
                        readOnly
                        rows={15}
                        className="input-field w-full text-sm"
                    />
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-brand-border">
                        {briefingData.icsDataUri && (
                            <a
                                href={briefingData.icsDataUri}
                                download={`${project.projectName}.ics`}
                                className="button-secondary text-sm"
                            >
                                Download .ICS
                            </a>
                        )}
                        {briefingData.googleCalendarLink && (
                            <a
                                href={briefingData.googleCalendarLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button-secondary text-sm"
                            >
                                Tambah ke Google Calendar
                            </a>
                        )}
                        <a
                            href={briefingData.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button-primary inline-flex items-center gap-2"
                        >
                            <SendIcon className="w-4 h-4" /> Bagikan ke WhatsApp
                        </a>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ProjectBriefingModal;
