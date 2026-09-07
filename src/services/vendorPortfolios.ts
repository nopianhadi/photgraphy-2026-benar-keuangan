import { supabase } from '../lib/supabaseClient';
import { VendorPortfolio, PortfolioImage } from '../types';
import { useAppStore } from '../store/useAppStore';

export const createVendorPortfolio = async (portfolioData: Omit<VendorPortfolio, 'id' | 'created_at' | 'updated_at'>): Promise<VendorPortfolio> => {
    // Ensure user_id is set
    const currentUser = useAppStore.getState().currentUser;
    const userId = portfolioData.user_id || currentUser?.id || '11111111-1111-1111-1111-111111111111';

    const payload = { ...portfolioData, user_id: userId };

    const { data, error } = await supabase
        .from('vendor_portfolios')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error creating portfolio:', error);
        if (error.code === '42P01' || (error as any).status === 404) {
            throw new Error('Tabel vendor_portfolios belum dibuat. Jalankan SQL migration 09_vendor_portfolios.sql di Supabase terlebih dahulu.');
        }
        throw new Error('Gagal membuat portofolio');
    }

    return data;
};

export const listVendorPortfolios = async (): Promise<VendorPortfolio[]> => {
    const { data, error } = await supabase
        .from('vendor_portfolios')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        // 42P01 = table does not exist (not yet migrated)
        if (error.code === '42P01' || (error as any).status === 404) {
            console.warn('[vendorPortfolios] Table does not exist yet. Run SQL migration 09_vendor_portfolios.sql');
            return [];
        }
        console.error('Error fetching portfolios:', error);
        return [];
    }

    return data || [];
};

export const getVendorPortfolio = async (id: string): Promise<VendorPortfolio | null> => {
    const { data, error } = await supabase
        .from('vendor_portfolios')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching portfolio:', error);
        return null;
    }

    return data;
};

export const updateVendorPortfolio = async (id: string, updates: Partial<VendorPortfolio>): Promise<VendorPortfolio> => {
    const { data, error } = await supabase
        .from('vendor_portfolios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating portfolio:', error);
        throw new Error('Gagal mengupdate portofolio');
    }

    return data;
};

export const deleteVendorPortfolio = async (id: string): Promise<void> => {
    // First, delete images from storage
    const portfolio = await getVendorPortfolio(id);
    if (portfolio) {
        const imagePaths: string[] = [];
        if (portfolio.cover_image_url) {
            const coverUrl = new URL(portfolio.cover_image_url);
            const path = coverUrl.pathname.split('/').pop();
            if (path) imagePaths.push(path);
        }
        
        if (portfolio.images && portfolio.images.length > 0) {
            portfolio.images.forEach(img => {
                const url = new URL(img.url);
                const path = url.pathname.split('/').pop();
                if (path) imagePaths.push(path);
            });
        }

        if (imagePaths.length > 0) {
            await supabase.storage
                .from('gallery-images')
                .remove(imagePaths);
        }
    }

    const { error } = await supabase
        .from('vendor_portfolios')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting portfolio:', error);
        throw new Error('Gagal menghapus portofolio');
    }
};

export const uploadPortfolioImages = async (
    portfolioId: string,
    files: File[],
    onProgress?: (progress: number) => void
): Promise<PortfolioImage[]> => {
    const uploadedImages: PortfolioImage[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${portfolioId}/img-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('gallery-images')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
        }

        const { data: urlData } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(fileName);

        uploadedImages.push({
            id: crypto.randomUUID(),
            url: urlData.publicUrl,
            uploadedAt: new Date().toISOString()
        });

        if (onProgress) {
            onProgress(Math.round(((i + 1) / files.length) * 100));
        }
    }

    if (uploadedImages.length > 0) {
        const portfolio = await getVendorPortfolio(portfolioId);
        if (portfolio) {
            const updatedImages = [...(portfolio.images || []), ...uploadedImages];
            await updateVendorPortfolio(portfolioId, { images: updatedImages });
        }
    }

    return uploadedImages;
};

export const uploadPortfolioCover = async (
    portfolioId: string,
    file: File
): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${portfolioId}/cover-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Error uploading cover:', uploadError);
        throw new Error('Gagal mengupload cover image');
    }

    const { data: urlData } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(fileName);

    const coverUrl = urlData.publicUrl;
    
    await updateVendorPortfolio(portfolioId, { cover_image_url: coverUrl });

    return coverUrl;
};
