import { Project, Profile } from '../../../types';

export interface ProjectBriefingData {
    text: string;
    whatsappLink: string;
    googleCalendarLink: string;
    icsDataUri: string;
}

export function generateProjectBriefing(project: Project, profile: Profile): ProjectBriefingData {
    const date = new Date(project.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const teamList = project.team && project.team.length > 0
        ? project.team.map(t => `- ${t.name}`).join('\n')
        : 'Tim belum ditugaskan.';

    const parts: string[] = [];
    parts.push(`${date}`);
    parts.push(`*${project.projectName}*`);
    parts.push(`\n*Tim Bertugas:*\n${teamList}`);

    if (project.startTime || project.endTime || project.location) parts.push('');

    if (project.startTime) parts.push(`*Waktu Mulai:* ${project.startTime}`);
    if (project.endTime) parts.push(`*Waktu Selesai:* ${project.endTime}`);
    if (project.location) parts.push(`*Lokasi :* ${project.location}`);

    if (project.notes) {
        parts.push('');
        parts.push(`*Catatan:*\n${project.notes}`);
    }

    if (project.location || project.driveLink) parts.push('');

    if (project.location) {
        const mapsQuery = encodeURIComponent(project.location);
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
        parts.push(`*Link Lokasi:*\n${mapsLink}`);
    }

    if (project.driveLink) {
        if (project.location) parts.push('');
        parts.push(`*Link Moodboard:*\n${project.driveLink}`);
    }

    if (profile.briefingTemplate) {
        parts.push('\n---\n');
        parts.push(profile.briefingTemplate);
    }

    const text = parts.join('\n').replace(/\n\n\n+/g, '\n\n').trim();
    const whatsappLink = `whatsapp://send?text=${encodeURIComponent(text)}`;

    const toGoogleCalendarFormat = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
    const timeRegex = /(\d{2}:\d{2})/;
    const startTimeMatch = project.startTime?.match(timeRegex);
    const endTimeMatch = project.endTime?.match(timeRegex);

    let googleCalendarLink = '';
    let icsDataUri = '';

    if (startTimeMatch) {
        const projectDateOnly = project.date.split('T')[0];
        const startDate = new Date(`${projectDateOnly}T${startTimeMatch[1]}:00`);
        const isInternalEvent = profile.eventTypes?.includes(project.projectType);
        const durationHours = isInternalEvent ? 2 : 8;

        const endDate = endTimeMatch
            ? new Date(`${projectDateOnly}T${endTimeMatch[1]}:00`)
            : new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

        const googleDates = `${toGoogleCalendarFormat(startDate)}/${toGoogleCalendarFormat(endDate)}`;
        const calendarDescription = `Briefing untuk ${project.projectName}:\n\n${text}`;

        googleCalendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(project.projectName)}&dates=${googleDates}&details=${encodeURIComponent(calendarDescription)}&location=${encodeURIComponent(project.location || '')}`;

        const icsDescription = calendarDescription.replace(/\n/g, '\\n');
        icsDataUri = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `UID:${project.id}@venapictures.com`,
            `DTSTAMP:${toGoogleCalendarFormat(new Date())}`,
            `DTSTART:${toGoogleCalendarFormat(startDate)}`,
            `DTEND:${toGoogleCalendarFormat(endDate)}`,
            `SUMMARY:${project.projectName}`,
            `DESCRIPTION:${icsDescription}`,
            `LOCATION:${project.location || ''}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');
    }

    return {
        text,
        whatsappLink,
        googleCalendarLink,
        icsDataUri
    };
}
