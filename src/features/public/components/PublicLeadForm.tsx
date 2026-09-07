import React, { useState } from 'react';
import { LeadStatus, ContactChannel, PublicLeadFormProps } from '../../../types';
import { createLead } from '../../../services/leads';
import { cleanPhoneNumber } from '../../../constants';

const PublicLeadForm: React.FC<PublicLeadFormProps> = ({ setLeads, userProfile, showNotification }) => {
    const [formState, setFormState] = useState({
        name: '',
        whatsapp: '',
        eventLocation: '',
        eventDate: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const notes = `Lead baru dari formulir website. Kota: ${formState.eventLocation}. Menunggu diskusi lebih lanjut.`;

        try {
            const created = await createLead({
                name: formState.name,
                whatsapp: formState.whatsapp,
                contactChannel: ContactChannel.WEBSITE,
                location: formState.eventLocation,
                status: LeadStatus.DISCUSSION,
                date: new Date().toISOString(),
                notes,
                eventDate: formState.eventDate || undefined,
            });
            setLeads(prev => [created, ...prev]);
            setIsSubmitted(true);

            if ((window as any).addNotification) {
                (window as any).addNotification({
                    title: 'Calon Pengantin Baru',
                    message: `${formState.name} telah mengisi formulir lead.`,
                    type: 'info',
                    action: { view: 'Calon Pengantin' }
                });
            }

            showNotification('Informasi Anda telah kami terima. Terima kasih!');
        } catch (err: any) {
            console.error('Submit error:', err);
            alert('Gagal mengirim formulir. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    React.useEffect(() => {
        if (userProfile.companyName) {
            document.title = `Inquiry | ${userProfile.companyName}`;
        }
    }, [userProfile.companyName]);

    const Logo = ({ size = "h-24" }: { size?: string }) => (
        <div className="text-center">
            <div className="text-4xl font-light tracking-widest text-gray-900 mb-2 font-serif">
                {userProfile.companyName || 'WEDDING'}
            </div>
            <div className="w-24 h-px bg-gray-900 mx-auto"></div>
            <div className="text-xs tracking-[0.3em] text-gray-500 mt-2 uppercase font-light">
                Consultant
            </div>
        </div>
    );

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mb-8">
                        <Logo />
                    </div>
                    
                    {/* Success Icon */}
                    <div className="w-16 h-16 mx-auto mb-6 bg-gray-900 text-white rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    
                    <h1 className="text-3xl font-light text-gray-900 mb-4 font-serif">
                        Terima Kasih
                    </h1>
                    
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Pesan Anda telah kami terima dengan baik.<br/>
                        Tim kami akan segera menghubungi Anda untuk konsultasi lebih lanjut.
                    </p>
                    
                    <a
                        href={`https://wa.me/${cleanPhoneNumber(userProfile.phone)}?text=Halo%20${encodeURIComponent(userProfile.companyName || '')}%2C%20saya%20sudah%20mengisi%20formulir%20inquiry.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Hubungi Kami di WhatsApp
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
                {/* Header Section */}
                <div className="bg-gray-900 text-white p-8 text-center">
                    <Logo />
                    <h1 className="text-3xl font-light text-white mt-6 mb-2 font-serif">
                        Konsultasi Pernikahan
                    </h1>
                    <p className="text-gray-300 text-sm tracking-wider uppercase">
                        Inquiry Form
                    </p>
                </div>

                {/* Form Section */}
                <div className="p-8 lg:p-12">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formState.name}
                                onChange={handleFormChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                placeholder="Masukkan nama lengkap"
                                required
                            />
                        </div>

                        {/* WhatsApp Field */}
                        <div className="space-y-2">
                            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Nomor WhatsApp
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                                    +62
                                </span>
                                <input
                                    type="tel"
                                    id="whatsapp"
                                    name="whatsapp"
                                    value={formState.whatsapp}
                                    onChange={handleFormChange}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                    placeholder="812 3456 7890"
                                    required
                                />
                            </div>
                        </div>

                        {/* Location Field */}
                        <div className="space-y-2">
                            <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Rencana Lokasi Acara
                            </label>
                            <input
                                type="text"
                                id="eventLocation"
                                name="eventLocation"
                                value={formState.eventLocation}
                                onChange={handleFormChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                placeholder="Kota atau venue acara"
                                required
                            />
                        </div>

                        {/* Event Date Field */}
                        <div className="space-y-2">
                            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 uppercase tracking-wider">
                                Tanggal Rencana Acara
                                <span className="text-xs normal-case text-gray-500 ml-2">(Opsional)</span>
                            </label>
                            <input
                                type="date"
                                id="eventDate"
                                name="eventDate"
                                value={formState.eventDate}
                                onChange={handleFormChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gray-900 text-white py-4 px-6 rounded-md hover:bg-gray-800 focus:ring-4 focus:ring-gray-900 focus:ring-opacity-50 transition-all duration-200 font-medium tracking-wider uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Kirim Informasi
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Privacy Notice & Direct Contact */}
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-4">
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Informasi Anda akan kami jaga kerahasiaannya dan hanya digunakan untuk keperluan konsultasi pernikahan.
                        </p>
                        
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px bg-gray-300 flex-1"></div>
                            <span className="text-xs text-gray-400 px-3">ATAU</span>
                            <div className="h-px bg-gray-300 flex-1"></div>
                        </div>

                        <a
                            href={`https://wa.me/${cleanPhoneNumber(userProfile.phone)}?text=Halo%20${encodeURIComponent(userProfile.companyName || '')}%2C%20saya%20tertarik%20dengan%20layanan%20konsultasi%20pernikahan.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-md hover:bg-gray-900 hover:text-white transition-all duration-200 font-medium"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Konsultasi Langsung
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicLeadForm;
