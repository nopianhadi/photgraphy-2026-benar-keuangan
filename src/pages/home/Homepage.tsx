
import React from 'react';
import { FolderKanbanIcon, DollarSignIcon, UsersIcon, CheckIcon, LinkIcon, HomeIcon, CalendarIcon, FileTextIcon, MessageSquareIcon, StarIcon, UserCheckIcon, BriefcaseIcon, WhatsappIcon } from '../../constants';

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border text-center">
        <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto mb-4 text-brand-accent">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-brand-text-light mb-2">{title}</h3>
        <p className="text-brand-text-secondary">{description}</p>
    </div>
);

const NavigationCard: React.FC<{ title: string; description: string; link: string; icon: React.ReactNode }> = ({ title, description, link, icon }) => (
    <div
        className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border hover:border-brand-accent/50 transition-all duration-200 cursor-pointer group"
        onClick={() => window.location.href = link}
    >
        <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent group-hover:bg-brand-accent/20 transition-colors">
                {icon}
            </div>
            <LinkIcon className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-accent transition-colors" />
        </div>
        <h3 className="text-lg font-bold text-brand-text-light mb-2 group-hover:text-brand-accent transition-colors">{title}</h3>
        <p className="text-brand-text-secondary text-sm">{description}</p>
    </div>
);

const Homepage: React.FC = () => {
    return (
        <div className="bg-brand-bg text-brand-text-primary">
            {/* Header */}
            <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-brand-surface/80 backdrop-blur-sm sticky top-0 z-50 border-b border-brand-border">
                <div className="flex items-center gap-2">
                    <img src="/assets/images/logos/logoIcon.svg" alt="weddfin logo" className="w-8 h-8" width="32" height="32" />
                    <span className="text-xl font-extrabold text-brand-text-light">weddfin</span>
                </div>
                <div className="space-x-2">
                    <button type="button" onClick={() => window.location.hash = '#/login'} className="button-primary px-6 py-2 text-sm">Masuk</button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48 px-6 bg-brand-surface">
                {/* Banner Background */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <picture>
                        <source srcSet="/assets/images/landingpage/banner-bg.webp" type="image/webp" />
                        <img src="/assets/images/landingpage/banner-bg.png" alt="" className="w-full h-full object-cover" width="1920" height="1080" loading="lazy" decoding="async" />
                    </picture>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-brand-text-light leading-tight">
                            Sistem Manajemen All-in-One <br /> untuk <span className="text-brand-accent">Vendor Photography</span>
                        </h1>
                        <p className="max-w-2xl mt-6 text-lg text-brand-text-secondary">
                            Dari manajemen pengantin dan Acara Pernikahan hingga keuangan dan penjadwalan tim, weddfin menyediakan semua yang Anda butuhkan untuk berkembang.
                        </p>
                        <button type="button" onClick={() => window.location.hash = '#/login'} className="mt-8 button-primary text-lg px-8 py-3">Masuk ke Dasbor Anda</button>
                    </div>

                    <div className="flex-1 relative">
                        <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
                            <picture>
                                <source srcSet="/assets/images/landingpage/banner-img.webp" type="image/webp" />
                                <img src="/assets/images/landingpage/banner-img.png" alt="Dashboard Preview" className="w-full h-auto" width="800" height="600" loading="lazy" decoding="async" />
                            </picture>
                        </div>
                        {/* Decorative blob/glow */}
                        <div className="absolute -inset-4 bg-brand-accent/20 blur-3xl -z-10 rounded-full"></div>
                    </div>
                </div>
            </section>

            {/* Quick Navigation Section */}
            <section className="py-20 px-6 bg-brand-bg">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-brand-text-light">Fitur Aplikasi INI </h2>
                        <p className="text-brand-text-secondary mt-2">Klik di Bawah untuk melihat</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <NavigationCard
                            title="Booking Publik"
                            description="Portal booking untuk calon pengantin wilayah Banten"
                            link="https://keuanganvendor.netlify.app//#/public-booking?region=jabodetabek"
                            icon={<CalendarIcon className="w-6 h-6" />}
                        />
                        <NavigationCard
                            title="Form Lead Baru"
                            description="Formulir untuk menambah lead potensial baru"
                            link="https://keuanganvendor.netlify.app/#/public-lead-form/VEN001"
                            icon={<UserCheckIcon className="w-6 h-6" />}
                        />
                        <NavigationCard
                            title="Portal Klien"
                            description="Dashboard khusus untuk klien mengecek progres proyek"
                            link="https://keuanganvendor.netlify.app/#/portal/e87dae9c-5d81-4046-815f-50485b8f3b89"
                            icon={<HomeIcon className="w-6 h-6" />}
                        />
                        <NavigationCard
                            title="Freelancer Portal"
                            description="Area kerja untuk freelancer dan vendor eksternal"
                            link="https://keuanganvendor.netlify.app/#/freelancer-portal/581d5995-7f0f-484a-b564-f1510db736fc"
                            icon={<BriefcaseIcon className="w-6 h-6" />}
                        />
                        <NavigationCard
                            title="Feedback & Ulasan"
                            description="Sistem feedback dan rating dari klien"
                            link="https://keuanganvendor.netlify.app/#/feedback"
                            icon={<StarIcon className="w-6 h-6" />}
                        />
                        <NavigationCard
                            title="Profil Pengguna"
                            description="Kelola profil dan pengaturan akun Anda"
                            link="https://keuanganvendor.netlify.app/#/profile"
                            icon={<UsersIcon className="w-6 h-6" />}
                        />
                        <NavigationCard
                            title="Invoice PDF"
                            description="Lihat dan download invoice dalam format PDF"
                            link="https://keuanganvendor.netlify.app/#/portal/invoice/dc202cfb-8674-4850-a5d1-52c6192c9ec7"
                            icon={<FileTextIcon className="w-6 h-6" />}
                        />
                        <NavigationCard
                            title="Komunikasi"
                            description="Pusat komunikasi dan pesan dengan klien"
                            link="https://keuanganvendor.netlify.app/#/messages"
                            icon={<MessageSquareIcon className="w-6 h-6" />}
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-brand-text-light">Sederhanakan Alur Kerja Anda</h2>
                        <p className="text-brand-text-secondary mt-2">Fokus pada kreativitas Anda, biarkan kami yang mengurus administrasinya.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            title="Manajemen Acara Pernikahan"
                            description="Lacak setiap Acara Pernikahan dari Calon Pengantin hingga selesai dengan papan Kanban visual dan checklist progres."
                            icon={<FolderKanbanIcon className="w-8 h-8" />}
                        />
                        <FeatureCard
                            title="Keuangan Terintegrasi"
                            description="Catat setiap transaksi, kelola akun, dan pantau arus kas bisnis Anda secara real-time."
                            icon={<DollarSignIcon className="w-8 h-8" />}
                        />
                        <FeatureCard
                            title="Portal Pengantin & Tim"
                            description="Berikan akses eksklusif kepada pengantin dan Tim / Vendor untuk melihat progres, file, dan jadwal."
                            icon={<UsersIcon className="w-8 h-8" />}
                        />
                    </div>
                </div>
            </section>

            {/* Video Tutorial Section */}
            <section className="py-20 px-6 bg-brand-bg">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-brand-text-light">Tutorial Video</h2>
                        <p className="text-brand-text-secondary mt-2">Pelajari cara menggunakan weddfin dengan mudah melalui video tutorial</p>
                    </div>
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-brand-border">
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src="https://www.youtube.com/embed/aAH3CWTKQq8"
                            title="weddfin Tutorial Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    </div>
                </div>
            </section>

            {/* Creator Section */}
            <section className="py-20 px-6 bg-brand-surface">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-brand-text-light">Profil Developer</h2>
                        <p className="text-brand-text-secondary mt-2">Web Dev, Desain Konten Medsos & Desain, Video Editor</p>
                    </div>
                    <div className="bg-brand-bg rounded-2xl shadow-2xl border border-brand-border p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            {/* Profile Photo */}
                            <div className="flex-shrink-0">
                                <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-brand-accent/20">
                                    <picture>
                                        <source srcSet="/assets/images/nopian-hadi.webp" type="image/webp" />
                                        <img
                                            src="/assets/images/nopian-hadi.jpg"
                                            alt="Nopian Hadi"
                                            className="w-full h-full object-cover"
                                            width="192"
                                            height="192"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </picture>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl md:text-3xl font-bold text-brand-text-light mb-2">Nopian Hadi</h3>
                                <p className="text-brand-accent font-semibold mb-4">
                                    Web Developer | Content & Social Media Designer | Video Editor
                                </p>
                                <p className="text-brand-text-secondary mb-6 leading-relaxed">
                                    Seorang profesional kreatif yang passionate dalam Web Development, Desain Konten Medsos & Desain, serta Video Editing.
                                    Saya fokus pada pembuatan solusi digital komprehensif yang tidak hanya terlihat bagus secara visual, tetapi juga berfungsi
                                    dengan sempurna dan memiliki user experience terbaik.
                                </p>

                                {/* Specializations */}
                                <div className="mb-6 space-y-2">
                                    <div className="flex items-start gap-2 justify-center md:justify-start">
                                        <span className="text-brand-text-light font-semibold min-w-[120px]">Spesialisasi:</span>
                                        <span className="text-brand-text-secondary">React, Node.js, TypeScript</span>
                                    </div>
                                    <div className="flex items-start gap-2 justify-center md:justify-start">
                                        <span className="text-brand-text-light font-semibold min-w-[120px]">Fokus:</span>
                                        <span className="text-brand-text-secondary">Performance & User Experience</span>
                                    </div>
                                    <div className="flex items-start gap-2 justify-center md:justify-start">
                                        <span className="text-brand-text-light font-semibold min-w-[120px]">Lokasi:</span>
                                        <span className="text-brand-text-secondary">Indonesia</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                    <a
                                        href="https://nopianhad1.netlify.app/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="button-secondary inline-flex items-center justify-center gap-2 px-6 py-3 group"
                                    >
                                        <LinkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span>Lihat Portfolio</span>
                                    </a>
                                    <a
                                        href="https://wa.me/6289540618407"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="button-primary inline-flex items-center justify-center gap-2 px-6 py-3 group"
                                    >
                                        <WhatsappIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span>Hubungi via WhatsApp</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 text-center text-brand-text-secondary text-sm">
                <p>&copy; {new Date().getFullYear()} weddfin. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Homepage;