import supabase from "./supabase";

// File Upload Functions
export class StorageService {
  /**
   * Upload profile image
   */
  static async uploadProfileImage(
    userId: string,
    fileUri: string,
    fileName: string,
  ) {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const filePath = `profiles/${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("user-images")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-images").getPublicUrl(filePath);

      return { data: { path: data.path, publicUrl }, error: null };
    } catch (error: any) {
      console.error("Upload profile image error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Upload receipt image
   */
  static async uploadReceiptImage(
    orderId: string,
    fileUri: string,
    fileName: string,
  ) {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const filePath = `receipts/${orderId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("order-receipts")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("order-receipts").getPublicUrl(filePath);

      return { data: { path: data.path, publicUrl }, error: null };
    } catch (error: any) {
      console.error("Upload receipt image error:", error);
      return { data: null, error: error.message };
    }
  }
}