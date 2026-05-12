import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { Inspiration, AddInspirationInput, EditInspirationInput, AddCommentInput, ToggleLikeInput } from "@/schemas/inspiration";
import { toast } from "sonner";

const getSupabase = () => createClient();

// --- QUERIES ---

export const useInspirations = () => {
    return useQuery({
        queryKey: ["inspirations"],
        queryFn: async () => {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from("inspirations")
                .select(`
                    *,
                    inspiration_likes (user_name),
                    inspiration_comments (
                        id,
                        user_name,
                        content,
                        created_at
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Sort comments by date (newest first)
            const processed = data.map((insp: any) => ({
                ...insp,
                inspiration_comments: insp.inspiration_comments.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
            }));

            return processed as Inspiration[];
        }
    });
};

// --- MUTATIONS ---

export const useAddInspiration = (user: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: AddInspirationInput) => {
            const supabase = getSupabase();
            // 1. Upload Photo
            const fileExt = input.photo.name.split('.').pop();
            const fileName = `inspiration_${Date.now()}.${fileExt}`;
            const arrayBuffer = await input.photo.arrayBuffer();
            const fileBuffer = new Uint8Array(arrayBuffer);

            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(fileName, fileBuffer, {
                    contentType: input.photo.type,
                    upsert: true
                });

            if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

            const { data: publicUrlData } = supabase.storage
                .from("images")
                .getPublicUrl(fileName);

            const photo_url = publicUrlData.publicUrl;

            // 2. Insert into DB
            const { data: newInspiration, error: dbError } = await supabase.from("inspirations").insert({
                title: input.title,
                category: input.category,
                notes: input.notes,
                photo_url
            }).select().single();

            if (dbError) throw dbError;

            // 3. Call API for Notification
            if (newInspiration) {
                await fetch("/api/inspirations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        intent: "add_inspiration",
                        title: input.title,
                        category: input.category,
                        user,
                        inspirationId: newInspiration.id,
                        photoUrl: photo_url
                    }),
                    credentials: "include"
                });
            }

            return newInspiration;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspirations"] });
            toast.success("Inspiração adicionada!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useDeleteInspiration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = getSupabase();
            const { error } = await supabase.from("inspirations").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspirations"] });
            toast.success("Inspiração removida!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useEditInspiration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: EditInspirationInput) => {
            const supabase = getSupabase();
            const { error } = await supabase
                .from("inspirations")
                .update({ title: input.title, notes: input.notes, category: input.category })
                .eq("id", input.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspirations"] });
            toast.success("Inspiração atualizada!");
        },
        onError: (error: any) => toast.error(error.message)
    });
};

export const useToggleLike = (user: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ inspirationId, hasLiked }: ToggleLikeInput) => {
            // Call API to handle DB + Notification
            const response = await fetch("/api/inspirations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    intent: "toggle_like",
                    inspirationId,
                    hasLiked,
                    user
                }),
                credentials: "include"
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao curtir");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspirations"] });
        },
        onError: (error: any) => {
            toast.error("Erro ao curtir.");
        }
    });
};

export const useAddComment = (user: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ inspirationId, content }: AddCommentInput) => {
            // Call API to handle DB + Notification
            const response = await fetch("/api/inspirations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    intent: "add_comment",
                    inspirationId,
                    content,
                    user
                }),
                credentials: "include"
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao comentar");
            }

            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspirations"] });
        },
        onError: (error: any) => {
            toast.error("Erro ao comentar.");
        }
    });
};
