
import { GoogleGenAI } from "@google/genai";
import { HouseType, DesignStyle } from "../types";

const API_KEY = process.env.API_KEY || '';

/**
 * Phân tích phong thủy dựa trên ngày sinh, tập trung từ năm 2026
 */
export const analyzeFengShui = async (birthDate: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Bạn là một chuyên gia phong thủy kiến trúc cao cấp. 
  Dựa trên ngày sinh khách hàng là: ${birthDate}.
  Hãy thực hiện phân tích chuyên sâu cho việc xây nhà tính từ năm 2026 trở đi:
  1. Xác định Bản Mệnh (Kim, Mộc, Thủy, Hỏa, Thổ) và giải thích tầm quan trọng của bản mệnh trong việc tạo sinh khí cho ngôi nhà mới.
  2. Phân tích chi tiết năm 2026 (Bính Ngọ) và các năm kế tiếp (2027, 2028). Kiểm tra xem tuổi gia chủ có phạm Kim Lâu, Hoang Ốc hay Tam Tai trong các năm này không.
  3. Đề xuất 3 thời điểm "Đại Cát Khởi Công" trong năm 2026 (bao gồm tháng/ngày dương và âm tương ứng). Nếu năm 2026 không tốt, hãy đề xuất năm gần nhất tốt nhất để khởi công.
  4. Đưa ra lời khuyên về hướng nhà chủ đạo hoặc màu sắc hợp mệnh để kích hoạt tài lộc từ năm 2026.
  
  YÊU CẦU: Trình bày bằng Tiếng Việt, ngôn ngữ trang trọng, uy tín của bậc thầy phong thủy. Sử dụng các biểu tượng (emoji) tinh tế. Giữ nội dung súc tích, chuyên nghiệp trong khoảng 250-300 chữ.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Thông tin phong thủy đang được cập nhật cho năm 2026...";
  } catch (error) {
    console.error("Lỗi phân tích phong thủy:", error);
    return "Không thể phân tích phong thủy lúc này. Vui lòng thử lại sau.";
  }
};

/**
 * Hàm hỗ trợ tạo thiết kế với cơ chế thử lại (retry)
 */
const generateWithRetry = async (
  ai: any,
  landImageBase64: string,
  prompt: string,
  maxRetries: number = 2
): Promise<{ imageUrl: string; description: string } | null> => {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: landImageBase64.split(',')[1],
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16",
          }
        }
      });

      let imageUrl = '';
      let description = '';

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          description += part.text;
        }
      }

      if (imageUrl) {
        return { imageUrl, description };
      }
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return null;
};

export const generateArchitecturalDesigns = async (
  landImageBase64: string,
  houseType: HouseType,
  style: DesignStyle,
  budget: string,
  landWidth: string,
  landLength: string,
  floors: string,
  frontYardLength: string,
  count: number = 3
): Promise<{ imageUrl: string; description: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const finalResults: { imageUrl: string; description: string }[] = [];
  
  const variations = [
    "Kiến trúc khối hiện đại, kính cường lực lớn, ban công rộng, mặt tiền ốp đá marble.",
    "Phong cách tối giản, hệ lam chắn nắng thẩm mỹ, chiếu sáng ngoại thất sang trọng.",
    "Kiến trúc xanh, gạch thông gió, ban công cây mướt, ánh sáng rực rỡ."
  ];

  for (let i = 0; i < count; i++) {
    const variationPrompt = variations[i % variations.length];
    const prompt = `THIẾT KẾ KIẾN TRÚC TOÀN CẢNH 9:16 (PHƯƠNG ÁN ${i + 1}):
    - Đất trống: ${landWidth}m x ${landLength}m.
    - Công trình: ${houseType}, ${floors} tầng, phong cách ${style}.
    - QUY TẮC: Hiển thị trọn vẹn từ móng đến đỉnh mái. Không cắt góc. Góc chụp Wide Angle.
    - KHOẢNG LÙI: ${frontYardLength}m sân trước.
    - CHI TIẾT: 8K Photorealistic, vật liệu rõ nét.
    - GHI CHÚ: ${variationPrompt}`;

    const result = await generateWithRetry(ai, landImageBase64, prompt);
    if (result) {
      finalResults.push({
        imageUrl: result.imageUrl,
        description: result.description || `Phương án ${i + 1} sắc nét.`
      });
    }
  }

  return finalResults;
};

export const editDesign = async (
  currentImageBase64: string,
  editPrompt: string
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `CHỈNH SỬA KIẾN TRÚC: ${editPrompt}. Giữ nguyên tỉ lệ 9:16, không mất đầu nhà.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: currentImageBase64.split(',')[1],
            mimeType: 'image/png',
          },
        },
        { text: prompt },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "9:16",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
