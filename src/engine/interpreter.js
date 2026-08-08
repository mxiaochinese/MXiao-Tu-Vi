"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInterpretations = buildInterpretations;
const fortune_1 = require("./fortune");
const patterns_1 = require("./patterns");
const content_pipeline_1 = require("./content-pipeline");

const MAJOR_PROFILES = {
    "tu-vi": { core: "khả năng quy tụ, tổ chức và giữ vai trò trung tâm", tension: "xu hướng muốn tự mình kiểm soát trục quyết định" },
    "liem-trinh": { core: "ý thức nguyên tắc, danh dự và ranh giới", tension: "sự cứng rắn hoặc nhạy cảm trước chuyện đúng sai" },
    "thien-dong": { core: "khả năng thích nghi, kết nối và thay đổi theo môi trường", tension: "tâm thế dễ dao động khi điều kiện bên ngoài biến chuyển" },
    "vu-khuc": { core: "năng lực quản lý nguồn lực, tính toán và theo đuổi kết quả", tension: "cách xử lý thiên về hiệu quả nên đôi lúc trở nên khô cứng" },
    "thai-duong": { core: "tính chủ động, tinh thần trách nhiệm và nhu cầu tạo ảnh hưởng công khai", tension: "áp lực phải thể hiện vai trò hoặc gánh trách nhiệm quá sớm" },
    "thien-co": { core: "khả năng quan sát biến động, suy tính và tìm phương án", tension: "tư duy liên tục khiến quyết định dễ bị kéo dài" },
    "thien-phu": { core: "năng lực quản trị, tích lũy và duy trì nền tảng", tension: "tâm lý ưu tiên an toàn có thể làm chậm thay đổi cần thiết" },
    "thai-am": { core: "sự tinh tế, khả năng tích lũy và quan sát chiều sâu", tension: "cảm xúc kín và xu hướng suy nghĩ nhiều trước khi bộc lộ" },
    "tham-lang": { core: "khả năng kết nối, trải nghiệm và nhận diện cơ hội", tension: "sự phân tán khi có quá nhiều lựa chọn cùng xuất hiện" },
    "cu-mon": { core: "năng lực phân tích, phản biện và diễn đạt", tension: "tranh luận, hiểu lầm hoặc áp lực từ lời nói" },
    "thien-tuong": { core: "khả năng phối hợp, giữ tiêu chuẩn và bảo vệ quan hệ", tension: "tâm thế phải cân bằng quá nhiều phía" },
    "thien-luong": { core: "ý thức nguyên tắc, hướng dẫn và bảo hộ", tension: "khuynh hướng tự đặt mình vào vai người chịu trách nhiệm" },
    "that-sat": { core: "khả năng quyết định, chịu áp lực và xử lý tình huống khó", tension: "nhịp hành động mạnh, dễ tạo va chạm khi thiếu khoảng lùi" },
    "pha-quan": { core: "năng lực cải tổ, kết thúc chu kỳ cũ và mở chu kỳ mới", tension: "biến động lớn khi quá trình thay đổi thiếu nền tảng ổn định" }
};

const PALACE_THEMES = {
    "Mệnh": "khí chất nền, cách tiếp nhận hoàn cảnh và phương thức tự định vị",
    "Phụ Mẫu": "quan hệ với cha mẹ, người nâng đỡ và các khuôn mẫu hình thành từ gia đình",
    "Phúc Đức": "nền tảng tinh thần, ảnh hưởng dòng họ và sức bền nội tâm",
    "Điền Trạch": "nhà ở, tài sản cố định và cảm giác ổn định trong môi trường cư trú",
    "Quan Lộc": "nghề nghiệp, vị trí xã hội và phương thức tạo ra thành tựu",
    "Nô Bộc": "bạn bè, đồng nghiệp, cộng sự và chất lượng mạng lưới xã hội",
    "Thiên Di": "hoạt động bên ngoài, dịch chuyển và cách cá nhân được nhìn nhận trong xã hội",
    "Tật Ách": "thể trạng, nhịp năng lượng và phản ứng khi áp lực tích tụ",
    "Tài Bạch": "khả năng tạo lập, quản lý và luân chuyển nguồn lực tài chính",
    "Tử Tức": "con cái, dự án dài hạn và những thành quả cần thời gian nuôi dưỡng",
    "Phu Thê": "quan hệ gắn bó, hôn nhân và cách hai bên phối hợp trong đời sống lâu dài",
    "Huynh Đệ": "anh chị em, quan hệ ngang hàng và cách chia sẻ trách nhiệm"
};

const PALACE_MANIFESTATIONS = {
    "Mệnh": "nhịp ra quyết định, mức chủ động và cách xác lập ranh giới cá nhân",
    "Phụ Mẫu": "cách tiếp nhận kỳ vọng gia đình, quan hệ với người nâng đỡ và mức độ kế thừa khuôn mẫu cũ",
    "Phúc Đức": "sức bền tâm lý, cách hồi phục sau biến động và ảnh hưởng của nền gia tộc",
    "Điền Trạch": "cách tạo không gian ổn định, tích lũy tài sản cố định và thích ứng với thay đổi nơi ở",
    "Quan Lộc": "kiểu công việc, cách nhận trách nhiệm và nhịp phát triển vị trí xã hội",
    "Nô Bộc": "cách chọn cộng sự, phân chia lợi ích và duy trì độ tin cậy trong mạng lưới",
    "Thiên Di": "cách phản ứng với môi trường mới, năng lực dịch chuyển và hình ảnh thể hiện ra bên ngoài",
    "Tật Ách": "nhịp tiêu hao năng lượng, khả năng hồi phục và phản ứng của cơ thể trước áp lực kéo dài",
    "Tài Bạch": "cách tạo thu nhập, quản lý dòng tiền và phản ứng trước cơ hội tài chính",
    "Tử Tức": "cách nuôi dưỡng con cái hoặc dự án dài hạn, mức kiên nhẫn và khả năng trao quyền",
    "Phu Thê": "cách hình thành cam kết, phân chia vai trò và xử lý khác biệt trong quan hệ gắn bó",
    "Huynh Đệ": "cách tương tác với người ngang hàng, chia sẻ trách nhiệm và duy trì ranh giới trong quan hệ gần"
};

const PALACE_LEADS = {
    "Mệnh": "Cách phản ứng và tự định vị",
    "Phụ Mẫu": "Quan hệ với cha mẹ, người nâng đỡ và các khuôn mẫu gia đình",
    "Phúc Đức": "Sức bền tinh thần và khả năng hồi phục sau biến động",
    "Điền Trạch": "Nhu cầu ổn định về nhà ở và tài sản tích lũy",
    "Quan Lộc": "Con đường nghề nghiệp và cách đảm nhận trách nhiệm",
    "Nô Bộc": "Cách chọn cộng sự và duy trì độ tin cậy trong quan hệ xã hội",
    "Thiên Di": "Khả năng thích nghi khi bước ra môi trường bên ngoài",
    "Tật Ách": "Nhịp sinh hoạt và cách cơ thể phản ứng khi áp lực kéo dài",
    "Tài Bạch": "Khả năng tạo thu nhập, giữ nguồn lực và xử lý biến động dòng tiền",
    "Tử Tức": "Cách nuôi dưỡng con cái hoặc những dự án cần thời gian",
    "Phu Thê": "Cách hình thành cam kết và xử lý khác biệt trong quan hệ gắn bó",
    "Huynh Đệ": "Cách chia sẻ trách nhiệm và giữ ranh giới với người ngang hàng"
};

const SUPPORT_ROLES = {
    "Lộc Tồn": "khả năng tích lũy và duy trì nguồn lực",
    "Tả Phù": "sự hỗ trợ từ cộng sự và năng lực tổ chức theo nhóm",
    "Hữu Bật": "khả năng nhận trợ giúp linh hoạt từ người xung quanh",
    "Văn Xương": "tư duy hệ thống, học tập và diễn đạt rõ ràng",
    "Văn Khúc": "khả năng cảm thụ, biểu đạt và xử lý thông tin mềm",
    "Thiên Khôi": "cơ hội được nhìn nhận hoặc gặp người dẫn dắt",
    "Thiên Việt": "sự hỗ trợ đúng lúc và khả năng tiếp cận nguồn lực tốt",
    "Thiên Mã": "dịch chuyển, thay đổi môi trường và mở rộng phạm vi hoạt động",
    "Quốc Ấn": "uy tín, trách nhiệm và dấu hiệu của vị trí chính thức",
    "Đào Hoa": "sức hút xã hội và khả năng tạo kết nối",
    "Hồng Loan": "độ nhạy trong quan hệ và nhu cầu gắn kết",
    "Thiên Hỷ": "không khí cởi mở, giao tiếp thuận và sự kiện mang tính kết nối",
    "Thiên Giải": "khả năng tháo gỡ trở ngại",
    "Địa Giải": "khả năng giảm nhẹ áp lực thực tế",
    "Giải Thần": "cơ chế điều hòa khi mâu thuẫn phát sinh",
    "Ân Quang": "sự hỗ trợ về tinh thần, học hỏi và thiện ý",
    "Thiên Quý": "quý nhân, sự nâng đỡ và cơ hội được bảo hộ",
    "Thiên Thọ": "sức bền và khả năng duy trì nhịp ổn định",
    "Thiên Phúc": "phúc khí, sự dung hòa và khả năng gặp điều kiện thuận",
    "Thiên Quan": "sự nâng đỡ từ hệ thống, người có thẩm quyền hoặc chuẩn mực chung",
    "Thiên Đức": "khả năng giảm xung đột và giữ giới hạn đạo lý",
    "Nguyệt Đức": "tính mềm hóa, thiện chí và khả năng hòa giải",
    "Bát Tọa": "nền tảng, sự sắp xếp và khả năng giữ vị trí",
    "Tam Thai": "quá trình tiến từng bậc và sự hỗ trợ theo lớp",
    "Thai Phụ": "khả năng chuẩn bị, nâng đỡ và hoàn thiện thủ tục",
    "Phong Cáo": "sự ghi nhận, danh vị hoặc kết quả được xác lập công khai",
    "Long Trì": "môi trường nâng đỡ, tính trang trọng và khả năng được bảo vệ",
    "Phượng Các": "khả năng biểu đạt, thẩm mỹ và sự ghi nhận từ cộng đồng",
    "Hoa Cái": "chiều sâu chuyên môn, thẩm mỹ và xu hướng làm việc độc lập",
    "Đường Phù": "tính quy củ, hồ sơ, giấy tờ và quy trình",
    "Thiên Tài": "khả năng ứng biến và sử dụng năng lực cá nhân đúng lúc",
    "Thiên Trù": "điều kiện nuôi dưỡng, hưởng dụng và chăm lo đời sống",
    "Thiên Y": "khả năng chăm sóc, phục hồi và quan tâm tới thể trạng",
    "Lưu Niên Văn Tinh": "nhu cầu học hỏi, viết, nói hoặc xử lý thông tin trong thời điểm được kích hoạt"
};

const CHALLENGE_ROLES = {
    "Kình Dương": "xung lực mạnh, cạnh tranh và va chạm trực diện",
    "Đà La": "trì hoãn, vướng mắc kéo dài và sức cản âm ỉ",
    "Địa Không": "khoảng trống, thay đổi đột ngột hoặc kỳ vọng khó giữ nguyên",
    "Địa Kiếp": "biến động mạnh và nguy cơ hao hụt khi quyết định thiếu độ lùi",
    "Hỏa Tinh": "nhịp phản ứng nhanh, áp lực bùng phát và tính nóng",
    "Linh Tinh": "sự bất ổn khó đoán và căng thẳng tích tụ",
    "Cự Môn": "mâu thuẫn qua lời nói và khác biệt trong cách diễn giải",
    "Thiên Hình": "tính nghiêm khắc, ranh giới pháp lý hoặc áp lực từ quy chuẩn",
    "Thiên Khốc": "gánh nặng cảm xúc và cảm giác thiếu sự chia sẻ",
    "Thiên Hư": "khoảng cách giữa kỳ vọng và kết quả thực tế",
    "Cô Thần": "xu hướng tự xử lý vấn đề và khó chia sẻ cảm xúc",
    "Quả Tú": "cảm giác tách biệt trong quan hệ gần",
    "Kiếp Sát": "tình huống bất ngờ buộc phải phản ứng nhanh",
    "Phá Toái": "sự việc vụn vặt, gián đoạn và hao tổn do nhiều đầu mối",
    "Thiên Không": "sự đảo chiều hoặc kết quả khác với dự tính ban đầu",
    "Lưu Hà": "dòng biến động khó giữ ổn định và nguy cơ bị cuốn theo tình thế",
    "Thiên La": "cảm giác bị ràng buộc bởi hoàn cảnh hoặc suy nghĩ lặp lại",
    "Địa Võng": "mạng lưới trách nhiệm chồng chéo và khó tách khỏi hệ quả cũ",
    "Thiên Riêu": "độ nhạy cảm, hấp lực cảm xúc và khả năng phát sinh nhiễu trong quan hệ",
    "Thiên Sứ": "áp lực buộc phải xử lý hậu quả hoặc phần việc khó né tránh",
    "Thiên Thương": "tổn hao do trách nhiệm, quan hệ hoặc sự cố ngoài dự tính"
};

const TRANSFORM_ROLES = {
    "Hóa Lộc": "mở rộng nguồn lực, khả năng tiếp nhận lợi ích và tăng tính thuận",
    "Hóa Quyền": "tăng quyền chủ động, trách nhiệm và mức độ phải đứng ra quyết định",
    "Hóa Khoa": "tăng tính minh bạch, khả năng học hỏi và sự ghi nhận",
    "Hóa Kỵ": "tạo điểm nghẽn, tâm lý vướng mắc hoặc vấn đề cần xử lý nhiều lần"
};

const TRIADS = [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]];

function getPalace(palaces, id) {
    return palaces.find((item) => item.id === id);
}

function movePalace(start, offset) {
    return ((start - 1 + offset) % 12 + 12) % 12 + 1;
}

function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
}

function formatList(list) {
    const values = unique(list);
    if (!values.length)
        return "";
    if (values.length === 1)
        return values[0];
    if (values.length === 2)
        return `${values[0]} và ${values[1]}`;
    return `${values.slice(0, -1).join(", ")} và ${values[values.length - 1]}`;
}

function getStars(palace, groups) {
    return palace.stars.filter((item) => groups.includes(item.group));
}

function getMovingStars(palace, layers) {
    return layers.flatMap((layer) => palace[layer] || []);
}

function starDisplay(star) {
    return `${star.name}${star.brightness ? ` ở trạng thái ${star.brightness}` : ""}`;
}

function majorDisplay(palace) {
    const major = getStars(palace, ["major"]);
    return major.length ? formatList(major.map(starDisplay)) : "vô chính diệu";
}

function brightnessSentence(star) {
    const profile = MAJOR_PROFILES[star.id] || { core: "đặc tính chủ đạo của sao", tension: "mặt căng thẳng của sao" };
    if (["Miếu", "Vượng", "Đắc", "Lợi"].includes(star.brightness)) {
        return `Ở thế ${star.brightness}, mặt tích cực của ${star.name}, thể hiện qua ${profile.core}, có xu hướng bộc lộ trực tiếp và giữ vai trò dẫn dắt; mặt căng thẳng liên quan đến ${profile.tension} thường chỉ nổi rõ khi cung đồng thời chịu nhiều sát tinh hoặc gặp vận hạn gây sức ép`;
    }
    if (["Hãm", "Bất"].includes(star.brightness)) {
        return `Ở thế ${star.brightness}, mặt tích cực của ${star.name}, gồm ${profile.core}, vẫn hiện diện nhưng thường biểu lộ sau va vấp hoặc qua một đường vòng; trong khi đó, mặt căng thẳng liên quan đến ${profile.tension} dễ xuất hiện sớm hơn khi hoàn cảnh thiếu ổn định`;
    }
    return `Ở trạng thái ${star.brightness || "trung bình"}, ${star.name} biểu hiện đồng thời mặt tích cực là ${profile.core} và mặt căng thẳng là ${profile.tension}; kết quả vì thế phụ thuộc nhiều vào phụ tinh, Tứ Hóa và các cung hội chiếu`;
}

function mappedRoleSentences(stars, roleMap, limit = 4) {
    const selected = stars.filter((star) => roleMap[star.name]).slice(0, limit);
    return selected.map((star) => `${star.name} làm rõ ${roleMap[star.name]}`);
}

function transformationSentences(palace) {
    return getStars(palace, ["transform"]).map((star) => `${star.name} khiến cung nghiêng thêm về ${TRANSFORM_ROLES[star.name] || "một chiều biến đổi riêng"}`);
}

function balanceState(palace, movingLayers = []) {
    const natalSupport = getStars(palace, ["support", "transform"]).length;
    const natalChallenge = getStars(palace, ["malefic"]).length;
    const moving = getMovingStars(palace, movingLayers);
    const movingSupport = moving.filter((item) => item.group.endsWith("support")).length;
    const movingChallenge = moving.filter((item) => item.group.endsWith("malefic")).length;
    const support = natalSupport + movingSupport;
    const challenge = natalChallenge + movingChallenge;
    if (support >= challenge + 3)
        return { label: "thiên về nâng đỡ", support, challenge };
    if (challenge >= support + 3)
        return { label: "thiên về thử thách", support, challenge };
    return { label: "đan xen thuận lợi và trở lực", support, challenge };
}

function relationSet(palaces, palace) {
    const triad = TRIADS.find((group) => group.includes(palace.id)) || [];
    const triadPalaces = triad.filter((id) => id !== palace.id).map((id) => getPalace(palaces, id));
    const opposite = getPalace(palaces, movePalace(palace.id, 6));
    return { triadPalaces, opposite };
}

function relatedPalaceClause(palace) {
    const major = getStars(palace, ["major"]);
    if (!major.length)
        return `${palace.name} tại ${palace.branch} là cung vô chính diệu, vì vậy ${PALACE_THEMES[palace.name]} phụ thuộc mạnh vào hệ sao hội chiếu`;
    const roles = major.map((star) => MAJOR_PROFILES[star.id]?.core || "đặc tính chủ đạo của sao");
    return `${palace.name} tại ${palace.branch} có ${majorDisplay(palace)}, đưa ${formatList(roles)} vào ${PALACE_THEMES[palace.name]}`;
}

function relationParagraph(palaces, palace) {
    const { triadPalaces, opposite } = relationSet(palaces, palace);
    const related = [...triadPalaces, opposite];
    const clauses = related.map(relatedPalaceClause);
    const supportive = related.reduce((sum, item) => sum + balanceState(item).support, 0);
    const challenging = related.reduce((sum, item) => sum + balanceState(item).challenge, 0);
    let closing = `Các chiều hỗ trợ và gây sức ép khá cân bằng, nên biểu hiện của cung ${palace.name} thay đổi rõ theo hoàn cảnh và lớp vận hạn đang kích hoạt`;
    if (supportive >= challenging + 5)
        closing = `Cụm cung liên hệ có nhiều yếu tố nâng đỡ hơn, giúp chủ đề của cung ${palace.name} có đường triển khai tương đối liền mạch khi các lĩnh vực liên quan cùng vận động`;
    if (challenging >= supportive + 5)
        closing = `Cụm cung liên hệ chứa nhiều yếu tố gây sức ép hơn, khiến chủ đề của cung ${palace.name} thường phải đi qua điều chỉnh, va chạm hoặc thay đổi cách xử lý trước khi ổn định`;
    return `Tam phương tứ chính đặt cung ${palace.name} trong một chuỗi liên hệ rõ: ${clauses.join("; ")}. Do đó, ${PALACE_THEMES[palace.name]} được hình thành đồng thời qua ${formatList(related.map((item) => PALACE_THEMES[item.name]))}. ${closing}.`;
}

function corePalaceParagraph(palace) {
    const major = getStars(palace, ["major"]);
    const theme = PALACE_THEMES[palace.name];
    const manifestation = PALACE_MANIFESTATIONS[palace.name];
    if (!major.length) {
        return `Cung ${palace.name} an tại ${palace.branch} là cung vô chính diệu. Vì thiếu một chính tinh tọa thủ làm trục cố định, ${theme} thường phản ứng mạnh hơn với phụ tinh, Tứ Hóa, tam phương và cung xung chiếu. Biểu hiện thực tế vì thế có độ biến thiên cao, đặc biệt ở ${manifestation}, và cần được đọc cùng vận hạn thay vì quy về một nét tính duy nhất.`;
    }
    const opening = major.length === 1
        ? `${major[0].name} giữ vai trò trung tâm, nhấn mạnh ${MAJOR_PROFILES[major[0].id]?.core || "đặc tính chủ đạo của sao"}`
        : `${major[0].name} tạo trục ${MAJOR_PROFILES[major[0].id]?.core || "chủ đạo"}, còn ${major.slice(1).map((star) => `${star.name} bổ sung ${MAJOR_PROFILES[star.id]?.core || "một chiều vận hành khác"}`).join("; ")}`;
    const brightness = major.map(brightnessSentence).join(". ");
    const tensions = unique(major.map((star) => MAJOR_PROFILES[star.id]?.tension));
    const tensionText = tensions.length
        ? `Điểm dễ mất cân bằng của bộ sao là ${formatList(tensions)}; xu hướng này chủ yếu bộc lộ khi môi trường đòi hỏi phản ứng nhanh hoặc khi cung bị nhiều sao gây trở lực kích hoạt`
        : `Mặt căng thẳng của bộ sao phụ thuộc chủ yếu vào các phụ tinh đi kèm`;
    return `Cung ${palace.name} an tại ${palace.branch} có ${majorDisplay(palace)}. ${opening}. ${brightness}. Trong phạm vi ${theme}, bộ sao này thường biểu hiện qua ${manifestation}. ${tensionText}.`;
}

function auxiliaryParagraph(palace, movingLayers = []) {
    const support = getStars(palace, ["support"]);
    const challenges = getStars(palace, ["malefic"]);
    const supportSentences = mappedRoleSentences(support, SUPPORT_ROLES);
    const challengeSentences = mappedRoleSentences(challenges, CHALLENGE_ROLES);
    const transformSentences = transformationSentences(palace);
    const balance = balanceState(palace, movingLayers);
    const parts = [];
    if (supportSentences.length)
        parts.push(`Ở chiều nâng đỡ, ${supportSentences.join("; ")}`);
    else if (support.length)
        parts.push(`Các trợ tinh ${formatList(support.slice(0, 6).map((star) => star.name))} tạo thêm lớp hỗ trợ cho chính tinh tọa thủ`);
    if (challengeSentences.length)
        parts.push(`Ở chiều gây sức ép, ${challengeSentences.join("; ")}`);
    else if (challenges.length)
        parts.push(`Các sao ${formatList(challenges.slice(0, 6).map((star) => star.name))} làm tăng độ phức tạp và biến động của cung`);
    if (transformSentences.length)
        parts.push(transformSentences.join("; "));
    if (palace.hasTuan || palace.hasTriet) {
        const blockers = formatList([palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""]);
        parts.push(`${blockers} án trực tiếp làm nhịp biểu hiện bị ngắt, chậm hoặc đổi hướng, vì vậy năng lực của chính tinh thường chỉ ổn định sau một giai đoạn điều chỉnh`);
    }
    if (!parts.length)
        parts.push(`Cung ít phụ tinh nổi bật, khiến chính tinh tọa thủ và tam phương tứ chính giữ vai trò chi phối rõ hơn`);
    let conclusion = `Hai chiều thuận và nghịch cùng tồn tại, nên ${PALACE_MANIFESTATIONS[palace.name]} có thể chuyển trạng thái khá nhanh khi bối cảnh thay đổi`;
    if (balance.label === "thiên về nâng đỡ")
        conclusion = `Thế cung thiên về nâng đỡ, vì vậy mặt tích cực của chính tinh có điều kiện duy trì đều hơn trong ${PALACE_MANIFESTATIONS[palace.name]}`;
    if (balance.label === "thiên về thử thách")
        conclusion = `Thế cung thiên về thử thách, vì vậy mặt mạnh của chính tinh thường xuất hiện sau khi cá nhân đã xử lý sức cản, độ trễ hoặc mâu thuẫn liên quan tới ${PALACE_MANIFESTATIONS[palace.name]}`;
    return `${parts.join(". ")}. ${conclusion}.`;
}

function compactPalaceSynthesis(palace, contextLabel) {
    const major = getStars(palace, ["major"]);
    const balance = balanceState(palace);
    if (!major.length) {
        return `Khi đặt cung ${palace.name} vào ${contextLabel}, đặc điểm nổi bật là trạng thái vô chính diệu tại ${palace.branch}. Cung này tiếp nhận ảnh hưởng từ hệ sao hội chiếu nhiều hơn từ một trục cố định, nên ${PALACE_MANIFESTATIONS[palace.name]} có xu hướng thay đổi theo môi trường và thời kỳ. Tổng thể phụ tinh hiện tại cho thấy thế cung ${balance.label}.`;
    }
    const roleText = formatList(major.map((star) => `${star.name} gắn với ${MAJOR_PROFILES[star.id]?.core || "đặc tính chủ đạo"}`));
    const strong = major.filter((star) => ["Miếu", "Vượng", "Đắc", "Lợi"].includes(star.brightness));
    const weak = major.filter((star) => ["Hãm", "Bất"].includes(star.brightness));
    let stateText = `Các chính tinh ở trạng thái trung gian, nên cách biểu hiện phụ thuộc nhiều vào phụ tinh và vận hạn`;
    if (strong.length && !weak.length)
        stateText = `${formatList(strong.map((star) => `${star.name} ở thế ${star.brightness}`))} giúp mặt tích cực của bộ sao hiện ra tương đối rõ`;
    if (weak.length && !strong.length)
        stateText = `${formatList(weak.map((star) => `${star.name} ở thế ${star.brightness}`))} làm mặt căng thẳng của bộ sao xuất hiện sớm hơn mặt thuận`;
    if (strong.length && weak.length)
        stateText = `${formatList(strong.map((star) => `${star.name} ở thế ${star.brightness}`))} tạo lực đẩy, trong khi ${formatList(weak.map((star) => `${star.name} ở thế ${star.brightness}`))} tạo phần cần điều chỉnh`;
    return `Trong ${contextLabel}, cung ${palace.name} tại ${palace.branch} được định hình bởi ${roleText}. ${stateText}. Vì thế, ${PALACE_MANIFESTATIONS[palace.name]} vừa mang dấu ấn của chính tinh, vừa chuyển động theo thế phụ tinh ${balance.label}.`;
}

function compactModifierSynthesis(palace, contextLabel) {
    const support = getStars(palace, ["support"]);
    const challenges = getStars(palace, ["malefic"]);
    const transforms = getStars(palace, ["transform"]);
    const supportRoles = mappedRoleSentences(support, SUPPORT_ROLES, 3);
    const challengeRoles = mappedRoleSentences(challenges, CHALLENGE_ROLES, 3);
    const clauses = [];
    if (supportRoles.length)
        clauses.push(`phần nâng đỡ đến từ ${supportRoles.join("; ")}`);
    else if (support.length)
        clauses.push(`${formatList(support.slice(0, 4).map((star) => star.name))} tạo nền hỗ trợ cho cung`);
    if (challengeRoles.length)
        clauses.push(`phần gây sức ép đến từ ${challengeRoles.join("; ")}`);
    else if (challenges.length)
        clauses.push(`${formatList(challenges.slice(0, 4).map((star) => star.name))} làm tăng độ phức tạp của cung`);
    if (transforms.length)
        clauses.push(`${formatList(transforms.map((star) => star.name))} làm thay đổi hướng biểu hiện của nguồn lực, trách nhiệm, sự ghi nhận hoặc điểm nghẽn`);
    if (palace.hasTuan || palace.hasTriet)
        clauses.push(`${formatList([palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""])} tạo độ trễ và buộc quá trình phát triển phải đổi nhịp`);
    if (!clauses.length)
        clauses.push(`cung ít phụ tinh nổi bật, nên chính tinh và hệ hội chiếu giữ vai trò lớn hơn`);
    return `Xét riêng ${contextLabel}, ${clauses.join("; ")}. Những yếu tố này tác động đồng thời lên ${PALACE_MANIFESTATIONS[palace.name]}, tạo ra cách biểu hiện cụ thể của cung thay vì tồn tại như các dấu hiệu tách rời.`;
}

function lifeBodyInteractionParagraph(life, body) {
    if (life.id === body.id)
        return `Mệnh và Thân đồng cung tại ${life.branch}, khiến động lực bên trong và cách hành động khi trưởng thành cùng đi qua một hệ sao. Sự thống nhất này làm đặc tính của ${majorDisplay(life)} xuất hiện khá nhất quán giữa cảm nhận cá nhân, lựa chọn thực tế và trách nhiệm lâu dài.`;
    return `Cung Mệnh tại ${life.branch} mở đầu phản ứng bằng ${formatList(getStars(life, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core || star.name))}, còn cung Thân tại ${body.branch} chuyển phản ứng ấy sang ${PALACE_THEMES[body.name]} qua ${formatList(getStars(body, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core || star.name))}. Sự khác biệt giữa hai cung cho thấy cá nhân có thể cảm nhận vấn đề theo một cách nhưng chỉ thực sự bộc lộ năng lực khi bước vào chủ đề của cung ${body.name}.`;
}

function periodNatalContext(palace, label) {
    const major = getStars(palace, ["major"]);
    if (!major.length)
        return `Nền sao gốc của cung ${palace.name} là vô chính diệu, nên ${label.toLowerCase()} phản ứng mạnh với các sao lưu và cung xung chiếu. Diễn biến của giai đoạn dễ đổi nhịp khi môi trường hoặc quan hệ liên quan thay đổi.`;
    const stars = major.map((star) => {
        const profile = MAJOR_PROFILES[star.id] || { core: "đặc tính chủ đạo", tension: "mặt căng thẳng" };
        return `${star.name} ở thế ${star.brightness || "trung bình"} đưa ${profile.core} vào giai đoạn, đồng thời giữ khả năng phát sinh ${profile.tension}`;
    });
    return `Nền sao gốc tại cung ${palace.name} gồm ${stars.join("; ")}. Trong ${label.toLowerCase()}, bộ sao này không tạo một tính cách mới, mà làm rõ cách ${PALACE_MANIFESTATIONS[palace.name]} được biểu hiện khi chủ đề của cung trở thành trọng tâm thời gian.`;
}

function movingBaseName(name) {
    return String(name || "")
        .replace(/^Lưu\s+/, "")
        .replace(/^Nguyệt\s+/, "")
        .replace(/^Nhật\s+/, "")
        .replace(/^Thời\s+/, "");
}

function movingRoleClause(star) {
    const base = movingBaseName(star.name);
    const role = SUPPORT_ROLES[base] || CHALLENGE_ROLES[base] || TRANSFORM_ROLES[base];
    if (role)
        return `${star.name} làm nổi bật ${role}`;
    if (base === "Thái Tuế")
        return `${star.name} xác định khu vực chịu tác động trực tiếp của năm`;
    if (["Nguyệt", "Nhật", "Thời"].includes(base))
        return `${star.name} xác định điểm tập trung của lớp thời gian đang xem`;
    return `${star.name} tạo thêm một lớp kích hoạt tại cung`;
}

function movingParagraph(palace, layerLabel, starArrayName, contextText) {
    const stars = palace[starArrayName] || [];
    if (!stars.length) {
        return `Trong ${layerLabel}, cung ${palace.name} không có điểm nhấn sao lưu trực tiếp. Vì vậy, ${PALACE_MANIFESTATIONS[palace.name]} chủ yếu tiếp tục theo nền sao gốc và chỉ đổi mức biểu hiện khi ${contextText} cùng tác động; đây là nhịp tương đối nền của lĩnh vực, không phải dấu hiệu cho một sự kiện riêng.`;
    }
    const support = stars.filter((item) => item.group.endsWith("support"));
    const challenge = stars.filter((item) => item.group.endsWith("malefic"));
    const cycle = stars.filter((item) => item.group.endsWith("cycle"));
    const movingRoles = (group, roleMap, fallback) => roleSummary(group.map((star) => ({ ...star, name: movingBaseName(star.name) })), roleMap, fallback);
    let conclusion = `${layerLabel} tạo cả phần thuận lẫn phần cần điều chỉnh tại cung ${palace.name}`;
    if ((support.length > 0 && challenge.length === 0) || support.length >= challenge.length + 2)
        conclusion = `${layerLabel} tạo điều kiện thuận hơn bình thường cho ${PALACE_MANIFESTATIONS[palace.name]}`;
    if ((challenge.length > 0 && support.length === 0) || challenge.length >= support.length + 2)
        conclusion = `${layerLabel} dễ làm ${PALACE_MANIFESTATIONS[palace.name]} xuất hiện thêm độ trễ, va chạm hoặc nhu cầu điều chỉnh`;
    const technical = formatList([...cycle, ...support, ...challenge].slice(0, 5).map((star) => star.name));
    const supportText = support.length ? `Điểm thuận liên quan đến ${movingRoles(support, SUPPORT_ROLES, "khả năng nhận hỗ trợ và chủ động xử lý")}` : "Chiều nâng đỡ không tạo điểm nhấn riêng tại bản cung";
    const challengeText = challenge.length ? `phần cần thận trọng liên quan đến ${movingRoles(challenge, CHALLENGE_ROLES, "sức cản hoặc thay đổi ngoài dự tính")}` : "phần gây sức ép không nổi trội tại bản cung";
    return `${conclusion}. Trong cách đọc kỹ thuật, ${technical} cùng hội tại cung ${palace.name}; khi tổng hợp theo nhóm chức năng, ${supportText.charAt(0).toLowerCase()}${supportText.slice(1)}, còn ${challengeText}. Tác động này chỉ thu hẹp thời điểm biểu hiện của ${PALACE_THEMES[palace.name]} và vẫn phải đặt dưới ${contextText}, thay vì được dùng như một kết luận độc lập.`;
}

function palaceEvidence(palace, groups = ["major", "support", "malefic", "transform"]) {
    const stars = getStars(palace, groups);
    return [{
        palaceId: palace.id,
        palaceName: palace.name,
        branch: palace.branch,
        starIds: stars.map((star) => star.id),
        states: stars.filter((star) => star.brightness).map((star) => `${star.id}:${star.brightnessCode || star.brightness}`)
    }];
}

function selectedStarEvidence(palace, stars) {
    return [{
        palaceId: palace.id,
        palaceName: palace.name,
        branch: palace.branch,
        starIds: stars.map((star) => star.id),
        states: stars.filter((star) => star.brightness).map((star) => `${star.id}:${star.brightnessCode || star.brightness}`)
    }];
}

function roleSummary(stars, roleMap, fallback) {
    const roles = unique(stars.map((star) => roleMap[star.name])).slice(0, 3);
    return roles.length ? formatList(roles) : fallback;
}

function palaceMainClaim(palace) {
    const major = getStars(palace, ["major"]);
    const balance = balanceState(palace);
    const lead = PALACE_LEADS[palace.name];
    if (!major.length)
        return palace.id % 2
            ? `${lead} có xu hướng linh hoạt và đổi theo hoàn cảnh nhiều hơn là đi theo một khuôn cố định`
            : `Không có một chính tinh làm trục cố định, ${lead.toLowerCase()} thường thích nghi theo môi trường và các cung liên hệ`;
    const cores = formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 3));
    const ending = balance.label === "thiên về nâng đỡ"
        ? "được duy trì tương đối liền mạch"
        : balance.label === "thiên về thử thách"
            ? "thường chỉ hình thành sau một vài lần điều chỉnh"
            : "thay đổi khá rõ theo môi trường và cách xử lý áp lực";
    if (palace.id % 3 === 0)
        return `Nổi bật trong ${lead.toLowerCase()} là ${cores}; nhịp phát triển ${ending}`;
    if (palace.id % 3 === 1)
        return `${lead} lấy ${cores} làm nền và ${ending}`;
    return `${cores.charAt(0).toUpperCase()}${cores.slice(1)} định hình ${lead.toLowerCase()}, trong khi độ ổn định ${ending}`;
}

function palaceParagraphs(palaces, palace, movingLayers = []) {
    const major = getStars(palace, ["major"]);
    const support = [...getStars(palace, ["support"]), ...getStars(palace, ["transform"]).filter((star) => star.name !== "Hóa Kỵ")];
    const challenges = [...getStars(palace, ["malefic"]), ...getStars(palace, ["transform"]).filter((star) => star.name === "Hóa Kỵ")];
    const { triadPalaces, opposite } = relationSet(palaces, palace);
    const related = [...triadPalaces, opposite];
    const insights = [];
    insights.push((0, content_pipeline_1.createAtomicInsight)({
        ruleId: `palace-${palace.id}-natal-core`,
        topic: palace.name,
        polarity: "neutral",
        strength: 8,
        evidence: palaceEvidence(palace, ["major"]),
        claim: palaceMainClaim(palace),
        explanation: major.length
            ? `Trong cách đọc Tử Vi, căn cứ chính là ${majorDisplay(palace)} tại ${palace.name}; trạng thái của bộ chính tinh cho biết mặt thuận dễ phát huy trực tiếp hay cần đi qua va vấp trước khi ổn định`
            : `Cung ${palace.name} tại ${palace.branch} là cung vô chính diệu, nên kết luận phải dựa nhiều hơn vào phụ tinh, tam phương tứ chính và đối cung thay vì gán một nét cố định`,
        manifestations: [`Trong đời sống, xu hướng này thường đi vào ${PALACE_MANIFESTATIONS[palace.name]}`],
        conditions: [palace.id % 3 === 0
            ? `khi hoàn cảnh cho phép phát huy ${formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 2)) || "ảnh hưởng của các cung hội chiếu"}, mặt thuận dễ rõ hơn; khi áp lực kéo dài, phần gây cản trở dễ nổi lên`
            : palace.id % 3 === 1
                ? `mặt tích cực rõ hơn khi hoàn cảnh cho phép phát huy ${formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 2)) || "ảnh hưởng của các cung hội chiếu"}; mặt khó nổi lên khi áp lực kéo dài hoặc các yếu tố gây cản trở cùng được kích hoạt`
                : `khả năng phát huy phụ thuộc việc môi trường có nâng đỡ ${formatList(unique(major.map((star) => MAJOR_PROFILES[star.id]?.core)).slice(0, 2)) || "ảnh hưởng của các cung hội chiếu"} hay đồng thời tạo thêm sức ép`],
        advice: `Điểm cần lưu ý là đây là đặc điểm nền của cung ${palace.name}, không phải một sự kiện chắc chắn hay kết luận cho mọi giai đoạn`,
        primaryPalace: palace.id
    }));
    if (support.length) {
        insights.push((0, content_pipeline_1.createAtomicInsight)({
            ruleId: `palace-${palace.id}-support`,
            topic: palace.name,
            polarity: "supportive",
            strength: 4 + Math.min(2, support.length / 4),
            evidence: selectedStarEvidence(palace, support),
            claim: `Điểm thuận của cung nằm ở ${roleSummary(support, { ...SUPPORT_ROLES, ...TRANSFORM_ROLES }, "khả năng nhận hỗ trợ và điều phối nguồn lực")}`,
            explanation: `Các yếu tố ${formatList(support.slice(0, 5).map((star) => star.name))} cùng củng cố chiều này, nhưng được đọc như một nhóm chức năng thay vì các lời giải rời cho từng sao`,
            manifestations: [`Nhờ đó, ${PALACE_MANIFESTATIONS[palace.name]} có thể giữ nhịp tốt hơn khi nguồn lực và quan hệ hỗ trợ hiện diện đúng lúc`],
            conditions: [`khả năng này phát huy rõ hơn khi các cung tam hợp cùng có nền hỗ trợ hoặc khi vận đang xét kích hoạt đúng trục`],
            primaryPalace: palace.id
        }));
    }
    if (challenges.length || palace.hasTuan || palace.hasTriet) {
        const blockers = formatList([palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""]);
        insights.push((0, content_pipeline_1.createAtomicInsight)({
            ruleId: `palace-${palace.id}-challenge`,
            topic: palace.name,
            polarity: "challenging",
            strength: 4 + Math.min(2, (challenges.length + Number(Boolean(blockers))) / 4),
            evidence: selectedStarEvidence(palace, challenges),
            claim: `độ ổn định có thể giảm khi ${roleSummary(challenges, CHALLENGE_ROLES, "sức cản hoặc độ trễ")} xuất hiện cùng lúc`,
            explanation: `${formatList(challenges.slice(0, 5).map((star) => star.name)) || "Các yếu tố gây cản trở"}${blockers ? ` cùng ${blockers}` : ""} làm nhịp biểu hiện dễ ngắt, chậm hoặc phải đổi cách xử lý`,
            manifestations: [`Mặt khó thường thể hiện ở ${PALACE_MANIFESTATIONS[palace.name]}, nhất là khi cá nhân phải phản ứng nhanh trong một hoàn cảnh thiếu ổn định`],
            conditions: [`đây là phần điều chỉnh của cung; nó rõ hơn khi vận cùng gây sức ép và nhẹ hơn khi tam phương có đủ yếu tố nâng đỡ`],
            primaryPalace: palace.id
        }));
    }
    const relatedSupport = related.reduce((sum, item) => sum + balanceState(item).support, 0);
    const relatedChallenge = related.reduce((sum, item) => sum + balanceState(item).challenge, 0);
    let relationClaim = `Xu hướng của ${palace.name} thay đổi theo cách các lĩnh vực liên quan phối hợp với nhau`;
    if (relatedSupport >= relatedChallenge + 5)
        relationClaim = `Các cung liên hệ tạo thêm nền nâng đỡ, giúp chủ đề ${palace.name} có đường triển khai liền mạch hơn`;
    if (relatedChallenge >= relatedSupport + 5)
        relationClaim = `Các cung liên hệ tạo áp lực đáng kể, nên điểm mạnh của ${palace.name} thường được dùng để thích nghi và điều chỉnh hơn là giữ nguyên một hoàn cảnh`;
    insights.push((0, content_pipeline_1.createAtomicInsight)({
        ruleId: `palace-${palace.id}-relations`,
        topic: palace.name,
        polarity: relatedSupport >= relatedChallenge + 5 ? "supportive" : relatedChallenge >= relatedSupport + 5 ? "challenging" : "neutral",
        strength: 3.5,
        evidence: related.flatMap((item) => palaceEvidence(item, ["major", "support", "malefic", "transform"])),
        claim: relationClaim,
        explanation: `Tam phương tứ chính nối ${palace.name} với ${formatList(triadPalaces.map((item) => item.name))} và đối cung ${opposite.name}; vì vậy ${PALACE_THEMES[palace.name]} không được đọc như một ô độc lập`,
        manifestations: [`Sự liên hệ này giải thích vì sao thay đổi ở ${formatList(related.map((item) => PALACE_THEMES[item.name]))} có thể làm cách biểu hiện của ${palace.name} đổi theo`],
        conditions: [`ảnh hưởng liên cung rõ nhất khi nhiều cung trong cùng trục được một lớp vận kích hoạt, còn ở lá số gốc đây vẫn là khuynh hướng nền`],
        primaryPalace: palace.id,
        relatedPalaces: related.map((item) => item.id),
        relationType: "tam_hop_doi_cung"
    }));
    const detail = palace.stars.length + (palace.hasTuan ? 2 : 0) + (palace.hasTriet ? 2 : 0);
    return (0, content_pipeline_1.synthesizeInsights)(insights, { maxParagraphs: detail >= 12 ? 4 : detail >= 7 ? 3 : 2 });
}

function makeItem(id, topic, title, paragraphs) {
    const cleanParagraphs = paragraphs.map((paragraph) => String(paragraph || "").trim()).filter(Boolean);
    return { id, topic, title, paragraphs: cleanParagraphs, body: cleanParagraphs.join("\n\n") };
}

function repeatedFocusParagraph(palaces, focusIds, label) {
    const counts = new Map();
    focusIds.filter(Boolean).forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ palace: getPalace(palaces, id), count }));
    const repeated = ranked.filter((item) => item.count > 1);
    if (repeated.length) {
        return `${label} có sự chồng lớp tại ${formatList(repeated.map((item) => `${item.palace.name} ở ${item.palace.branch}`))}. Khi một cung đồng thời xuất hiện ở nhiều tầng vận, chủ đề của cung đó thường trở thành trục chính và các sự kiện liên quan có xu hướng biểu hiện rõ hơn so với những cung chỉ xuất hiện một lần.`;
    }
    return `${label} phân bố trên nhiều cung khác nhau. Điều này cho thấy diễn biến không tập trung hoàn toàn vào một lĩnh vực, thay vào đó được chia thành nhiều đầu mối và cần đọc theo thứ tự từ đại vận đến lớp thời gian hẹp hơn.`;
}

function thematicSynthesis(palaces, title, primaryName, relatedNames) {
    const primary = palaces.find((item) => item.name === primaryName);
    const related = relatedNames.map((name) => palaces.find((item) => item.name === name)).filter(Boolean);
    const all = [primary, ...related];
    const supportScore = all.reduce((sum, item) => sum + balanceState(item).support, 0);
    const challengeScore = all.reduce((sum, item) => sum + balanceState(item).challenge, 0);
    const topicManifestations = {
        "Sự nghiệp": "kiểu môi trường phù hợp, mức chủ động, cách nhận trách nhiệm và khả năng phối hợp với người khác",
        "Tài chính": "khả năng tạo thu nhập, cách tích lũy, độ biến động của dòng tiền và phản ứng trước cơ hội",
        "Tình cảm": "cách hình thành cam kết, nhu cầu về khoảng riêng và phương thức xử lý khác biệt",
        "Gia đình và quan hệ": "mức gần gũi, cách chia sẻ trách nhiệm và ranh giới giữa các thế hệ hoặc nhóm quan hệ",
        "Sức khỏe và nhịp sống": "sức bền, mức tiêu hao khi căng thẳng và khả năng duy trì nhịp sinh hoạt ổn định"
    };
    const mainPolarity = supportScore >= challengeScore + 5 ? "supportive" : challengeScore >= supportScore + 5 ? "challenging" : "mixed";
    const mainClaim = mainPolarity === "supportive"
        ? `${title} có nền thuận tương đối rõ, nhưng kết quả vẫn phụ thuộc cách nguồn lực được duy trì trong thực tế`
        : mainPolarity === "challenging"
            ? `${title} thường phát triển qua điều chỉnh và thay đổi nhịp hơn là theo một đường hoàn toàn ổn định`
            : `${title} có cả khả năng phát triển lẫn điểm dễ gây gián đoạn, nên điều quan trọng nằm ở cách hai chiều này được cân bằng`;
    const insights = [(0, content_pipeline_1.createAtomicInsight)({
        ruleId: `theme-${primary.id}-main`,
        topic: title,
        polarity: mainPolarity,
        strength: 5,
        evidence: all.flatMap((item) => palaceEvidence(item)),
        claim: mainClaim,
        explanation: `Căn cứ chính nằm ở cung ${primary.name} tại ${primary.branch}, sau đó được đối chiếu với ${formatList(related.map((item) => `${item.name} tại ${item.branch}`))}; bộ chính tinh ${majorDisplay(primary)} tạo trục, còn các cung liên hệ cho biết trục ấy được hỗ trợ hay bị điều chỉnh ra sao`,
        manifestations: [`Trong đời sống, cấu trúc này thường thể hiện qua ${topicManifestations[title] || PALACE_MANIFESTATIONS[primary.name]}`],
        conditions: [`mặt thuận rõ hơn khi các cung liên hệ cùng nâng đỡ; nếu một cung trọng yếu chịu nhiều sức ép, kết quả dễ đổi nhịp dù bản cung vẫn có năng lực`],
        advice: title === "Sức khỏe và nhịp sống"
            ? "Nội dung chỉ mô tả khuynh hướng về nhịp sinh hoạt và sức bền, không thay thế đánh giá hoặc chẩn đoán y khoa"
            : `Phần này mô tả khuynh hướng của ${title.toLowerCase()}, không khẳng định một kết quả cố định hay thay thế quyết định thực tế`,
        primaryPalace: primary.id,
        relatedPalaces: related.map((item) => item.id),
        relationType: "functional"
    })];
    const transforms = all.flatMap((item) => getStars(item, ["transform"]));
    if (transforms.length) {
        insights.push((0, content_pipeline_1.createAtomicInsight)({
            ruleId: `theme-${primary.id}-transforms`,
            topic: title,
            polarity: transforms.some((star) => star.name === "Hóa Kỵ") ? "mixed" : "supportive",
            strength: 4,
            evidence: all.flatMap((item) => palaceEvidence(item, ["transform"])),
            claim: `Khả năng tiếp nhận nguồn lực, nắm quyền chủ động, được ghi nhận hoặc gặp điểm nghẽn là lớp điều chỉnh đáng chú ý của chủ đề này`,
            explanation: `Trong cách đọc Tử Vi, nhóm Tứ Hóa ${formatList(transforms.map((star) => star.name))} xuất hiện trong cụm cung liên quan, nên tác động được tổng hợp theo toàn trục thay vì gán mỗi sao cho một kết luận riêng`,
            manifestations: [`Sự điều chỉnh thường đi vào ${topicManifestations[title] || PALACE_MANIFESTATIONS[primary.name]} và có thể làm cùng một năng lực biểu hiện khác nhau theo từng giai đoạn`],
            conditions: [`Tứ Hóa chỉ làm rõ hướng vận hành đã có sẵn; mức biểu hiện còn phụ thuộc chính tinh, phụ tinh và lớp vận đang kích hoạt`],
            primaryPalace: primary.id,
            relatedPalaces: related.map((item) => item.id),
            relationType: "functional"
        }));
    }
    return (0, content_pipeline_1.synthesizeInsights)(insights, { maxParagraphs: 3 });
}

function periodParagraphs(palaces, palace, label, contextIds, movingConfig) {
    const balance = balanceState(palace, movingConfig ? [movingConfig.arrayName] : []);
    const contextPalaces = contextIds.filter(Boolean).map((id) => getPalace(palaces, id));
    const main = (0, content_pipeline_1.createAtomicInsight)({
        ruleId: `period-${label}-${palace.id}-main`,
        topic: label,
        polarity: balance.label === "thiên về nâng đỡ" ? "supportive" : balance.label === "thiên về thử thách" ? "challenging" : "mixed",
        strength: 5,
        evidence: palaceEvidence(palace),
        claim: `${label} làm ${PALACE_LEADS[palace.name].toLowerCase()} trở thành trọng tâm rõ hơn bình thường`,
        explanation: `Lớp vận này đi vào cung ${palace.name} tại ${palace.branch}, nơi có ${majorDisplay(palace)} làm nền; vì vậy vận chỉ tăng hoặc điều chỉnh mức biểu hiện của một xu hướng sẵn có, không tạo thành đặc điểm cả đời mới`,
        manifestations: [`Trong giai đoạn này, trọng tâm thường đi vào ${PALACE_MANIFESTATIONS[palace.name]}`],
        conditions: [`mặt thuận dễ phát huy khi nền sao gốc và các lớp vận lớn hơn cùng hướng; nếu hai lớp trái chiều, diễn biến thường xuất hiện theo từng đợt và cần đọc theo lớp thời gian dài trước`],
        primaryPalace: palace.id,
        relatedPalaces: contextPalaces.map((item) => item.id),
        relationType: "fortune_activation"
    });
    const network = (0, content_pipeline_1.createAtomicInsight)({
        ruleId: `period-${label}-${palace.id}-network`,
        topic: label,
        polarity: "neutral",
        strength: 4,
        evidence: [palace, ...contextPalaces].flatMap((item) => palaceEvidence(item)),
        claim: `Ý nghĩa của giai đoạn hình thành từ sự liên kết giữa ${palace.name} và ${formatList(contextPalaces.map((item) => item.name)) || "nền lá số"}, không phải từ một cung riêng lẻ`,
        explanation: (0, patterns_1.buildActivationParagraph)(palaces, [palace.id, ...contextIds], `Xét toàn bộ chuỗi thời gian`),
        manifestations: [`Một thay đổi ở cung trọng tâm có thể lan sang ${formatList(contextPalaces.map((item) => PALACE_THEMES[item.name])) || "những lĩnh vực liên hệ"}, nhưng mức độ phụ thuộc thứ tự Đại hạn, Tiểu hạn, vận năm và lớp thời gian hẹp hơn`],
        conditions: [`sự chồng lớp tại cùng một cung làm chủ đề rõ hơn; khi các lớp phân tán, diễn biến có xu hướng chia thành nhiều đầu mối`],
        primaryPalace: palace.id,
        relatedPalaces: contextPalaces.map((item) => item.id),
        relationType: "fortune_activation"
    });
    const insights = [main, network];
    if (movingConfig) {
        const moving = palace[movingConfig.arrayName] || [];
        const movingSupport = moving.filter((star) => star.group.endsWith("support"));
        const movingChallenge = moving.filter((star) => star.group.endsWith("malefic"));
        const movingRoleText = [
            movingSupport.length ? `phần thuận liên quan đến ${roleSummary(movingSupport.map((star) => ({ ...star, name: movingBaseName(star.name) })), SUPPORT_ROLES, "khả năng nhận hỗ trợ")}` : "",
            movingChallenge.length ? `phần cần thận trọng liên quan đến ${roleSummary(movingChallenge.map((star) => ({ ...star, name: movingBaseName(star.name) })), CHALLENGE_ROLES, "sức cản hoặc thay đổi ngoài dự tính")}` : ""
        ].filter(Boolean);
        insights.push((0, content_pipeline_1.createAtomicInsight)({
            ruleId: `period-${label}-${palace.id}-${movingConfig.arrayName}`,
            topic: label,
            polarity: balance.label === "thiên về nâng đỡ" ? "supportive" : balance.label === "thiên về thử thách" ? "challenging" : "mixed",
            strength: 4.5,
            evidence: [{ palaceId: palace.id, layer: movingConfig.arrayName, starIds: moving.map((star) => star.id) }],
            claim: moving.length
                ? `Trong lớp thời gian hẹp hơn, nhịp của cung ${palace.name} ${balance.label === "thiên về nâng đỡ" ? "được hỗ trợ rõ hơn" : balance.label === "thiên về thử thách" ? "dễ có thêm độ trễ hoặc áp lực" : "đan xen cơ hội với phần cần điều chỉnh"}`
                : `Lớp thời gian hẹp hơn không tạo thêm một điểm nhấn sao lưu trực tiếp tại cung ${palace.name}`,
            explanation: moving.length
                ? `Nhóm sao lưu tại cung gồm ${formatList(moving.slice(0, 5).map((star) => star.name))}; khi tổng hợp theo chức năng, ${formatList(movingRoleText) || "trọng tâm thời gian được xác định rõ hơn"}, thay vì tách thành các lời phán riêng`
                : `Trọng tâm vẫn do nền sao gốc và quan hệ với ${movingConfig.context} quyết định`,
            manifestations: [`Biểu hiện thường thu hẹp vào ${PALACE_MANIFESTATIONS[palace.name]} trong ${movingConfig.label}`],
            conditions: [`lớp thời gian này chỉ cho biết thời điểm một xu hướng dễ nổi lên, không đủ để kết luận sự kiện dài hạn nếu đứng một mình`],
            primaryPalace: palace.id,
            relationType: "fortune_activation"
        }));
    }
    return (0, content_pipeline_1.synthesizeInsights)(insights, { maxParagraphs: movingConfig ? 3 : 2 });
}

function timelineParagraphs(palaces, activeDecadePalaceId) {
    const ordered = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart);
    const activeIndex = Math.max(0, ordered.findIndex((palace) => palace.id === activeDecadePalaceId));
    const start = Math.max(0, Math.min(ordered.length - 4, activeIndex - 1));
    const selected = ordered.slice(start, start + 4);
    return selected.map((palace, index) => {
        const previous = index ? selected[index - 1] : ordered[start - 1];
        const balance = balanceState(palace);
        const transition = previous
            ? `So với giai đoạn ${previous.decadeStart}-${previous.decadeEnd} tuổi, trọng tâm chuyển từ ${PALACE_THEMES[previous.name]} sang ${PALACE_THEMES[palace.name]}`
            : `Đây là một trong những giai đoạn đầu của chuỗi Đại hạn được hiển thị trong báo cáo`;
        let tone = `thế cung đan xen yếu tố nâng đỡ và gây sức ép, nên quá trình thường có cả phần phát triển lẫn phần phải điều chỉnh`;
        if (balance.label === "thiên về nâng đỡ")
            tone = `thế cung có nhiều yếu tố nâng đỡ hơn, tạo điều kiện để chủ đề này được duy trì tương đối liền mạch`;
        if (balance.label === "thiên về thử thách")
            tone = `thế cung có nhiều yếu tố gây sức ép hơn, nên điểm mạnh thường được hình thành qua thay đổi nhịp hoặc xử lý trở lực`;
        const current = palace.id === activeDecadePalaceId ? " Đây là Đại hạn hiện tại theo tuổi mụ đang dùng trong lá số." : "";
        return `${palace.decadeStart}-${palace.decadeEnd} tuổi là giai đoạn ${PALACE_LEADS[palace.name].toLowerCase()} nổi lên rõ hơn. ${transition}; ${tone}.${current}`;
    });
}

function overviewTopicParagraph(palaces, title, primaryName, relatedNames) {
    const primary = palaces.find((palace) => palace.name === primaryName);
    const related = relatedNames.map((name) => palaces.find((palace) => palace.name === name)).filter(Boolean);
    const cluster = [primary, ...related];
    const support = cluster.reduce((sum, palace) => sum + balanceState(palace).support, 0);
    const challenge = cluster.reduce((sum, palace) => sum + balanceState(palace).challenge, 0);
    const tone = support >= challenge + 5
        ? "có nền nâng đỡ rõ hơn phần gây sức ép"
        : challenge >= support + 5
            ? "thường phát triển qua nhiều lần điều chỉnh hơn là theo một nhịp cố định"
            : "đan xen khả năng phát triển với phần cần điều chỉnh theo hoàn cảnh";
    const focus = {
        "Sự nghiệp": "Trọng tâm nằm ở cách nhận trách nhiệm, mức chủ động và sự thích nghi với môi trường làm việc",
        "Tài chính": "Điểm đáng chú ý là mối liên hệ giữa khả năng tạo thu nhập, nhịp nghề nghiệp và cách giữ nguồn lực",
        "Tình cảm": "Trục quan hệ tập trung vào cách hình thành cam kết, nhu cầu phối hợp và khoảng riêng của mỗi bên",
        "Gia đình và quan hệ": "Nền gia đình được nhìn qua cách chia sẻ trách nhiệm, giữ ranh giới và duy trì sự nâng đỡ",
        "Sức khỏe và nhịp sống": "Phần thể trạng chỉ tập trung vào sức bền, áp lực và nhịp sinh hoạt"
    }[title] || `Trọng tâm nằm ở ${PALACE_MANIFESTATIONS[primary.name]}`;
    return `${title} ${tone}. ${focus}. Kết luận này được tổng hợp từ cung ${primary.name} cùng ${formatList(related.map((palace) => palace.name))}, nên thay đổi ở một trục có thể làm cách biểu hiện của toàn chủ đề đổi theo.`;
}

function buildInterpretations(params) {
    const {
        palaces,
        annualStars,
        monthlyStars,
        dailyStars,
        hourlyStars,
        lifePalace,
        bodyPalace,
        nominalAge,
        birthElement,
        bureauElement,
        bureauLabel,
        activeDecadePalaceId,
        annualDecadePalaceId,
        minorFortunePalaceId,
        yearBranchPalaceId,
        monthlyPalaceId,
        dailyPalaceId,
        hourlyPalaceId,
        viewYear,
        viewYearCanChi,
        viewMonth,
        viewLeap,
        monthCanChi,
        viewDay,
        viewDayCanChi,
        viewHourBranch,
        viewHourCanChi
    } = params;
    const items = [];
    const life = getPalace(palaces, lifePalace);
    const body = getPalace(palaces, bodyPalace);
    const activeDecade = activeDecadePalaceId ? getPalace(palaces, activeDecadePalaceId) : null;
    const annualDecade = annualDecadePalaceId ? getPalace(palaces, annualDecadePalaceId) : null;
    const minorFortune = getPalace(palaces, minorFortunePalaceId);
    const yearBranchPalace = getPalace(palaces, yearBranchPalaceId);
    const monthlyPalace = getPalace(palaces, monthlyPalaceId);
    const dailyPalace = getPalace(palaces, dailyPalaceId);
    const hourlyPalace = getPalace(palaces, hourlyPalaceId);
    const bureauRelation = (0, fortune_1.getElementRelation)(birthElement, bureauElement);

    const configurationParagraphs = (0, patterns_1.buildConfigurationParagraphs)(palaces, life.id);
    const adjacentParagraphs = (0, patterns_1.buildAdjacentParagraphs)(palaces, life.id);
    const lifeBalance = balanceState(life);
    const bodyAxis = body.id === life.id
        ? `Mệnh và Thân đồng cung tại ${life.branch}, nên cách cảm nhận và cách hành động lâu dài có xu hướng nhất quán hơn`
        : `Mệnh tại ${life.branch} tạo phản ứng ban đầu, còn Thân cư ${body.name} tại ${body.branch} chuyển phản ứng ấy vào ${PALACE_THEMES[body.name]}`;
    items.push(makeItem("overview-structure", "Tổng quan", "Khí chất và trục phát triển", [
        `${palaceMainClaim(life)}. ${bodyAxis}. Vì vậy, điểm đáng chú ý không chỉ là khí chất bên trong mà còn là cách khí chất ấy được đưa vào lựa chọn và trách nhiệm thực tế theo thời gian.`,
        `Căn cứ chuyên môn nằm ở cung Mệnh có ${majorDisplay(life)}, cung Thân có ${majorDisplay(body)} và quan hệ Mệnh - Cục ${bureauRelation.description}. ${configurationParagraphs[0] || adjacentParagraphs[0] || `Tam phương tứ chính của Mệnh cho thấy thế cung ${lifeBalance.label}, nên các mặt thuận và phần gây sức ép phải được đọc cùng nhau.`}`,
        `Trục chi phối nhiều phần của lá số là sự chuyển tiếp từ ${PALACE_THEMES[life.name]} sang ${PALACE_THEMES[body.name]}. Đây là sợi nối giữa khí chất, công việc, nguồn lực và quan hệ; các phần sau mở rộng từng mặt của cùng một cấu trúc thay vì đưa ra những kết luận rời nhau.`
    ]));

    items.push(makeItem("overview-capacity", "Tổng quan", "Năng lực và điểm tạo áp lực", [
        `${palaceMainClaim(life)}. Điểm thuận nằm ở ${roleSummary(getStars(life, ["support"]), SUPPORT_ROLES, "khả năng duy trì và điều phối nguồn lực")}; phần dễ tạo áp lực liên quan đến ${roleSummary(getStars(life, ["malefic"]), CHALLENGE_ROLES, "độ trễ hoặc mâu thuẫn khi hoàn cảnh thay đổi")}. Hai mặt cùng tồn tại nên năng lực thường rõ nhất trong cách xử lý tình huống thực tế, không phải ở một nhãn tính cách cố định.`,
        `Căn cứ tại cung Mệnh gồm phụ tinh và Tứ Hóa ${formatList(getStars(life, ["support", "transform"]).slice(0, 5).map((star) => star.name)) || "không có điểm nhấn riêng"}, đồng thời có nhóm gây sức ép ${formatList(getStars(life, ["malefic"]).slice(0, 5).map((star) => star.name)) || "không nổi trội"}. Tam phương tứ chính nối Mệnh với ${formatList(relationSet(palaces, life).triadPalaces.map((palace) => palace.name))} và ${relationSet(palaces, life).opposite.name}, vì vậy mặt mạnh hay mặt khó chỉ nổi rõ khi các lĩnh vực này cùng tạo điều kiện tương ứng.`
    ]));

    items.push(makeItem("overview-work", "Tổng quan", "Công việc và nguồn lực", [
        overviewTopicParagraph(palaces, "Sự nghiệp", "Quan Lộc", ["Mệnh", "Thiên Di", "Tài Bạch"]),
        overviewTopicParagraph(palaces, "Tài chính", "Tài Bạch", ["Quan Lộc", "Điền Trạch", "Phúc Đức"])
    ]));

    items.push(makeItem("overview-relations", "Tổng quan", "Quan hệ và nền tinh thần", [
        overviewTopicParagraph(palaces, "Tình cảm", "Phu Thê", ["Mệnh", "Phúc Đức", "Thiên Di"]),
        overviewTopicParagraph(palaces, "Gia đình và quan hệ", "Phúc Đức", ["Phụ Mẫu", "Huynh Đệ", "Nô Bộc"])
    ]));

    items.push(makeItem("overview-timeline", "Tổng quan", "Dòng thời gian nổi bật", [
        `Các mốc dưới đây là Đại hạn 10 năm và đều dùng tuổi mụ theo cùng quy ước với tuổi đang hiển thị trên lá số. Mỗi giai đoạn cho biết chủ đề nào dễ nổi lên hơn, không phải danh sách tuổi tốt, tuổi xấu hay sự kiện chắc chắn.`,
        ...timelineParagraphs(palaces, activeDecadePalaceId)
    ]));

    items.push(makeItem("overview-period", "Tổng quan", `Trục vận hạn năm ${viewYearCanChi}`, [
        `Điểm khác của năm ${viewYearCanChi} so với nền lá số là trọng tâm tạm thời chuyển sang ${formatList(unique([activeDecade, annualDecade, minorFortune, yearBranchPalace].filter(Boolean).map((palace) => PALACE_THEMES[palace.name])))}. Ở tuổi mụ ${nominalAge}, ${activeDecade ? `năm này nằm trong Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại cung ${activeDecade.name}` : "lá số chưa bước vào Đại hạn 10 năm đầu tiên"}; các lớp ngắn hơn chỉ điều chỉnh mức độ và thời điểm biểu hiện của bối cảnh đó.`,
        repeatedFocusParagraph(palaces, [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId, monthlyPalaceId, dailyPalaceId, hourlyPalaceId], `Các lớp vận trong năm ${viewYear}`),
        `Lưu đại hạn đi vào ${annualDecade ? `${annualDecade.name} tại ${annualDecade.branch}` : "vị trí chưa xác định"}, Tiểu hạn ở ${minorFortune.name}, còn Lưu Thái Tuế tại ${yearBranchPalace.name}. Chuỗi này cho biết năm dễ nhấn mạnh ${formatList(unique([annualDecade, minorFortune, yearBranchPalace].filter(Boolean).map((palace) => PALACE_THEMES[palace.name])))}, nhưng không đủ để khẳng định một sự kiện cụ thể.`
    ]));

    items.push(makeItem("life-detail", "Mệnh - Thân", `Mối liên hệ giữa Mệnh và Thân`, [
        `${palaceMainClaim(life)}. Đây là “con người nền”: cách tiếp nhận hoàn cảnh và phản ứng trước khi trách nhiệm thực tế buộc phải lựa chọn. Cung Mệnh tại ${life.branch} có ${majorDisplay(life)}, còn phụ tinh và tam phương quyết định mặt nào của bộ sao dễ biểu hiện rõ hơn.`,
        body.id === life.id
            ? `Mệnh và Thân đồng cung nên phần cảm nhận bên trong và cách đi vào đời sống thực tế cùng dùng một hệ sao. ${lifeBodyInteractionParagraph(life, body)} Điểm mạnh là tính nhất quán; mặt cần điều chỉnh là một áp lực tại cung này có thể đồng thời ảnh hưởng tới cả cách nghĩ lẫn cách hành động.`
            : `Thân cư ${body.name} cho thấy khí chất của Mệnh chỉ bộc lộ đầy đủ khi đi vào ${PALACE_THEMES[body.name]}. Cung Thân có ${majorDisplay(body)}, vì vậy ${formatList(getStars(body, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core)) || "ảnh hưởng của hệ hội chiếu"} là cách nền tính khí được chuyển thành lựa chọn, trách nhiệm và kết quả cụ thể.`,
        body.id === life.id
            ? `Tam phương tứ chính của cung đồng Mệnh - Thân nối trục này với ${formatList(relationSet(palaces, life).triadPalaces.map((item) => PALACE_THEMES[item.name]))} và ${PALACE_THEMES[relationSet(palaces, life).opposite.name]}. Bối cảnh liên cung quyết định đặc tính nhất quán ấy trở thành thế mạnh hay áp lực trong từng giai đoạn.`
            : `Hai cung tạo hai lớp khác nhau: Mệnh thiên về ${formatList(getStars(life, ["major"]).map((star) => MAJOR_PROFILES[star.id]?.core)) || "phản ứng theo môi trường"}, còn Thân đưa trọng tâm sang ${PALACE_THEMES[body.name]}. Khi hai lớp cùng chiều, hành động dễ nhất quán với suy nghĩ; khi trái chiều, cá nhân có thể cần thời gian để biến điều mình nhận thấy thành lựa chọn phù hợp.`,
        `Khái quát lại, Mệnh giải thích khuynh hướng tương đối ổn định, còn Thân cho biết khuynh hướng đó tập trung vào đâu khi trưởng thành. Các vận hạn chỉ kích hoạt hoặc điều chỉnh mức biểu hiện của hai nền này, không tạo ra một “con người mới” tách khỏi lá số gốc.`
    ]));

    palaces.forEach((palace) => {
        items.push(makeItem(`palace-${palace.id}`, "12 cung", `${palace.name} tại ${palace.branch}`, palaceParagraphs(palaces, palace)));
    });

    items.push(makeItem("career-synthesis", "Sự nghiệp", "Cấu trúc nghề nghiệp và vị trí xã hội", thematicSynthesis(palaces, "Sự nghiệp", "Quan Lộc", ["Mệnh", "Thiên Di", "Tài Bạch"])));
    items.push(makeItem("finance-synthesis", "Tài chính", "Khả năng tạo lập và giữ nguồn lực", thematicSynthesis(palaces, "Tài chính", "Tài Bạch", ["Quan Lộc", "Điền Trạch", "Phúc Đức"])));
    items.push(makeItem("relationship-synthesis", "Tình cảm", "Mẫu hình quan hệ gắn bó", thematicSynthesis(palaces, "Tình cảm", "Phu Thê", ["Mệnh", "Phúc Đức", "Thiên Di"])));
    items.push(makeItem("family-synthesis", "Gia đình - Quan hệ", "Nền tảng gia đình và mạng lưới quan hệ", thematicSynthesis(palaces, "Gia đình và quan hệ", "Phúc Đức", ["Phụ Mẫu", "Huynh Đệ", "Tử Tức", "Nô Bộc"])));
    items.push(makeItem("health-synthesis", "Sức khỏe - Nhịp sống", "Thể trạng và phản ứng trước áp lực", [
        ...thematicSynthesis(palaces, "Sức khỏe và nhịp sống", "Tật Ách", ["Mệnh", "Phúc Đức"]),
        "Phần này chỉ mô tả khuynh hướng nhịp năng lượng và phản ứng trước áp lực theo hệ thống Tử Vi truyền thống. Nội dung không thay thế đánh giá y khoa hoặc chẩn đoán sức khỏe."
    ]));

    if (activeDecade) {
        const orderedDecades = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart);
        const activeIndex = orderedDecades.findIndex((palace) => palace.id === activeDecade.id);
        const previous = orderedDecades[activeIndex - 1];
        const next = orderedDecades[activeIndex + 1];
        const decadeCopy = periodParagraphs(
            palaces,
            activeDecade,
            `Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`,
            [annualDecadePalaceId, minorFortunePalaceId],
            null
        );
        decadeCopy.push(`${previous ? `Giai đoạn trước đặt trọng tâm ở ${PALACE_THEMES[previous.name]}` : "Đây là Đại hạn đầu trong chuỗi hiện có"}, còn Đại hạn hiện tại chuyển sang ${PALACE_THEMES[activeDecade.name]}.${next ? ` Giai đoạn kế tiếp sẽ chuyển trọng tâm sang ${PALACE_THEMES[next.name]}, vì vậy thời kỳ này đóng vai trò ${activeDecade.name === next.name ? "củng cố" : "chuyển tiếp"} giữa hai hướng phát triển.` : " Đây là giai đoạn cuối trong dải Đại hạn được tính."} So sánh này mô tả sự thay đổi trọng tâm, không khẳng định một sự kiện sẽ xảy ra ở tuổi cụ thể.`);
        items.push(makeItem("decade-main", "Đại vận", `Đại hạn ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`, decadeCopy));
    }
    else {
        const firstDecade = [...palaces].sort((a, b) => a.decadeStart - b.decadeStart)[0];
        items.push(makeItem("decade-before-start", "Đại vận", "Giai đoạn trước đại vận đầu tiên", [
            `Tuổi mụ ${nominalAge} chưa bước vào đại vận mười năm đầu. Đại vận đầu bắt đầu từ ${firstDecade.decadeStart} tuổi tại cung ${firstDecade.name} ở ${firstDecade.branch}. Giai đoạn hiện tại vì thế được đọc chủ yếu từ cung Mệnh, cung Thân và các lớp lưu niên.`,
            `${periodNatalContext(firstDecade, "Đại vận đầu tiên")} Đây là cấu trúc sẽ giữ vai trò nền khi đại vận đầu chính thức bắt đầu.`
        ]));
    }
    if (annualDecade) {
        items.push(makeItem("annual-decade", "Đại vận", `Lưu đại hạn năm ${viewYear}`, periodParagraphs(
            palaces,
            annualDecade,
            `Lưu đại hạn năm ${viewYear}`,
            [activeDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId],
            { label: `năm ${viewYear}`, arrayName: "annualStars", context: "đại vận mười năm và tiểu hạn" }
        )));
    }

    items.push(makeItem("minor-fortune", "Tiểu vận", `Lưu niên tiểu hạn năm ${viewYear}`, periodParagraphs(
        palaces,
        minorFortune,
        `Tiểu hạn năm ${viewYearCanChi}`,
        [activeDecadePalaceId, annualDecadePalaceId, yearBranchPalaceId],
        { label: `năm ${viewYear}`, arrayName: "annualStars", context: "đại vận, lưu đại hạn và Lưu Thái Tuế" }
    )));
    items.push(makeItem("annual-moving-stars", "Tiểu vận", "Cấu trúc sao lưu của năm", [
        `Sao lưu của năm phân bố trên ${palaces.filter((palace) => palace.annualStars.length).length} cung, vì vậy nhịp năm không quy về một lĩnh vực duy nhất. Các điểm nhấn chính liên quan đến ${formatList(palaces.filter((palace) => palace.annualStars.length).slice(0, 5).map((palace) => PALACE_THEMES[palace.name]))}; mức biểu hiện phải đặt dưới Đại hạn và Tiểu hạn đang có.`,
        `Trong cách đọc kỹ thuật, nhóm sao lưu tạo các chiều về nguồn lực, quyền chủ động, sự ghi nhận, dịch chuyển và sức ép. Báo cáo chỉ tổng hợp tác động chung tại cung chúng đi tới, vì một sao lưu đơn lẻ không đủ để biến thành kết luận về cả năm.`
    ]));

    const annualTopic = `Vận hạn ${viewYear}`;
    const focusIds = [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId];
    items.push(makeItem("year-synthesis", annualTopic, `Tổng hợp vận hạn năm ${viewYearCanChi}`, [
        `Năm ${viewYearCanChi} được đặt trong đại vận ${activeDecade ? `${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi tại cung ${activeDecade.name}` : "chưa xác định"}. Lưu đại hạn đi vào ${annualDecade ? `${annualDecade.name} tại ${annualDecade.branch}` : "vị trí chưa xác định"}, tiểu hạn nằm tại ${minorFortune.name} ở ${minorFortune.branch}, còn Lưu Thái Tuế đi tới ${yearBranchPalace.name} ở ${yearBranchPalace.branch}. Bốn lớp này cho biết bối cảnh dài hạn, trọng tâm của riêng năm và khu vực dễ xuất hiện sự kiện.`,
        (0, patterns_1.buildActivationParagraph)(palaces, focusIds, `Cấu trúc năm ${viewYear}`),
        `Xét các cung trọng tâm, năm chạm tới ${formatList(unique(focusIds.filter(Boolean).map((id) => PALACE_THEMES[getPalace(palaces, id).name])))}. Những lĩnh vực này có xu hướng liên hệ với nhau, vì quyết định ở một cung có thể tạo phản ứng dây chuyền sang các cung còn lại. Báo cáo năm vì vậy ưu tiên mối liên hệ giữa các cung hơn việc diễn giải từng sao lưu đơn lẻ.`
    ]));

    const annualSubjects = [
        ["year-career", "Công việc và vị trí xã hội", "Quan Lộc", ["Thiên Di", "Mệnh"]],
        ["year-finance", "Tài chính và nguồn lực", "Tài Bạch", ["Quan Lộc", "Điền Trạch"]],
        ["year-relationship", "Tình cảm và quan hệ gắn bó", "Phu Thê", ["Mệnh", "Phúc Đức"]],
        ["year-health", "Thể trạng và nhịp sống", "Tật Ách", ["Mệnh", "Phúc Đức"]]
    ];
    annualSubjects.forEach(([id, title, primaryName, relatedNames]) => {
        const primary = palaces.find((item) => item.name === primaryName);
        const related = relatedNames.map((name) => palaces.find((item) => item.name === name));
        const natalCopy = thematicSynthesis(palaces, title.startsWith("Công việc") ? "Sự nghiệp" : title.startsWith("Tài chính") ? "Tài chính" : title.startsWith("Tình cảm") ? "Tình cảm" : "Sức khỏe và nhịp sống", primaryName, relatedNames);
        const annualAtPrimary = primary.annualStars || [];
        items.push(makeItem(id, annualTopic, `${title} năm ${viewYear}`, [
            `So với nền lá số, ${title.toLowerCase()} trong năm ${viewYear} ${annualAtPrimary.length ? `được kích hoạt trực tiếp tại cung ${primary.name}, nên ${PALACE_MANIFESTATIONS[primary.name]} dễ nổi lên rõ hơn` : `không nhận điểm nhấn sao lưu trực tiếp tại cung ${primary.name}, nên thay đổi chủ yếu đến từ Đại hạn, Tiểu hạn và các cung liên hệ`}. Đây là khác biệt về mức độ và thời điểm biểu hiện, không phải một đặc điểm lâu dài mới.`,
            natalCopy[0],
            movingParagraph(primary, `năm ${viewYear}`, "annualStars", `${formatList(related.map((item) => item.name))}, đại vận và tiểu hạn`),
            `Kết luận của năm còn phụ thuộc ${formatList(related.map((item) => PALACE_THEMES[item.name]))}. Khi các cung này cùng hướng với ${primary.name}, xu hướng dễ liền mạch hơn; nếu trái chiều, cơ hội ở một mặt có thể đi kèm áp lực điều chỉnh ở mặt khác, vì vậy không nên gắn toàn bộ năm với nhãn tốt hoặc xấu.`
        ]));
    });

    const monthTopic = `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""}`;
    items.push(makeItem("month-synthesis", monthTopic, `Tổng hợp tháng ${viewMonth} âm lịch - ${monthCanChi}`, periodParagraphs(
        palaces,
        monthlyPalace,
        `Lưu nguyệt tháng ${viewMonth}${viewLeap ? " nhuận" : ""} âm lịch`,
        [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId],
        { label: `tháng ${viewMonth} âm lịch`, arrayName: "monthlyStars", context: "đại vận, lưu đại hạn và tiểu hạn của năm" }
    )));

    const dayTopic = `Lưu nhật ngày ${viewDay}`;
    items.push(makeItem("day-synthesis", dayTopic, `Tổng hợp ngày ${viewDay} âm lịch - ${viewDayCanChi}`, periodParagraphs(
        palaces,
        dailyPalace,
        `Lưu nhật ngày ${viewDay} âm lịch`,
        [monthlyPalaceId, minorFortunePalaceId, annualDecadePalaceId],
        { label: `ngày ${viewDay} âm lịch`, arrayName: "dailyStars", context: "lưu nguyệt, tiểu hạn và vận năm" }
    )));

    const hourTopic = `Lưu thời giờ ${viewHourBranch}`;
    items.push(makeItem("hour-synthesis", hourTopic, `Tổng hợp giờ ${viewHourCanChi}`, periodParagraphs(
        palaces,
        hourlyPalace,
        `Lưu thời giờ ${viewHourCanChi}`,
        [dailyPalaceId, monthlyPalaceId, minorFortunePalaceId],
        { label: `giờ ${viewHourCanChi}`, arrayName: "hourlyStars", context: "lưu nhật, lưu nguyệt và tiểu hạn" }
    )));
    return (0, content_pipeline_1.finalizeInterpretations)(items);
}
