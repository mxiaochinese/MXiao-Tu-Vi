"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInterpretations = buildInterpretations;
const fortune_1 = require("./fortune");
const patterns_1 = require("./patterns");

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
        return `Trong ${layerLabel}, cung ${palace.name} không nhận nhóm sao lưu chính đang được mã hóa. Trọng tâm thời gian vẫn nằm tại ${PALACE_THEMES[palace.name]}, nhưng mức độ biểu hiện chủ yếu do nền sao gốc và quan hệ với ${contextText} quyết định.`;
    }
    const support = stars.filter((item) => item.group.endsWith("support"));
    const challenge = stars.filter((item) => item.group.endsWith("malefic"));
    const cycle = stars.filter((item) => item.group.endsWith("cycle"));
    const sections = [];
    if (cycle.length)
        sections.push(cycle.map(movingRoleClause).join("; "));
    if (support.length)
        sections.push(`Ở chiều thuận, ${support.map(movingRoleClause).join("; ")}`);
    if (challenge.length)
        sections.push(`Ở chiều gây sức ép, ${challenge.map(movingRoleClause).join("; ")}`);
    let balance = `Hai chiều thuận và nghịch cùng tác động, làm ${PALACE_MANIFESTATIONS[palace.name]} trở thành nơi dễ thay đổi nhịp trong ${layerLabel}`;
    if ((support.length > 0 && challenge.length === 0) || support.length >= challenge.length + 2)
        balance = `Nhóm sao nâng đỡ chiếm ưu thế, nên ${PALACE_MANIFESTATIONS[palace.name]} có điều kiện vận hành thuận hơn trong ${layerLabel}`;
    if ((challenge.length > 0 && support.length === 0) || challenge.length >= support.length + 2)
        balance = `Nhóm sao gây sức ép chiếm ưu thế, nên ${PALACE_MANIFESTATIONS[palace.name]} dễ xuất hiện độ trễ, va chạm hoặc nhu cầu điều chỉnh trong ${layerLabel}`;
    return `${sections.join(". ")}. Các sao lưu cùng hội tại cung ${palace.name}, vì vậy tác động của chúng quy tụ trực tiếp vào ${PALACE_THEMES[palace.name]}. ${balance}. Khi đặt dưới ${contextText}, lớp thời gian này cho biết mức độ và thời điểm biểu hiện của một xu hướng đã có sẵn trong lá số, thay vì tạo ra một chủ đề hoàn toàn tách biệt.`;
}

function palaceParagraphs(palaces, palace, movingLayers = []) {
    return [corePalaceParagraph(palace), auxiliaryParagraph(palace, movingLayers), relationParagraph(palaces, palace)];
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
    const first = compactPalaceSynthesis(primary, `bức tranh ${title.toLowerCase()}`);
    const relationClauses = related.map((item) => {
        const major = getStars(item, ["major"]);
        if (!major.length)
            return `${item.name} tại ${item.branch} là cung vô chính diệu, khiến ${PALACE_THEMES[item.name]} biến đổi mạnh theo hội chiếu`;
        return `${item.name} tại ${item.branch} có ${majorDisplay(item)}, đưa ${formatList(major.map((star) => MAJOR_PROFILES[star.id]?.core || "đặc tính chủ đạo của sao"))} vào ${PALACE_THEMES[item.name]}`;
    });
    const second = `${title} không chỉ nằm tại cung ${primary.name}. Cụm liên hệ còn gồm ${relationClauses.join("; ")}. Vì vậy, kết quả của lĩnh vực này hình thành từ sự phối hợp giữa ${PALACE_THEMES[primary.name]}, ${formatList(related.map((item) => PALACE_THEMES[item.name]))}; thay đổi ở một trục có thể kéo theo phản ứng ở các trục còn lại.`;
    const all = [primary, ...related];
    const supportScore = all.reduce((sum, item) => sum + balanceState(item).support, 0);
    const challengeScore = all.reduce((sum, item) => sum + balanceState(item).challenge, 0);
    let third = `Toàn bộ cụm cung có thế thuận nghịch tương đối cân bằng. ${title} vì thế thường phát triển theo từng giai đoạn, với kết quả phụ thuộc nhiều vào vận hạn đang kích hoạt cung nào và cách các cung phối hợp tại thời điểm đó.`;
    if (supportScore >= challengeScore + 5)
        third = `Trong toàn bộ cụm cung, cát tinh và yếu tố nâng đỡ nổi trội hơn. Điều này tạo nền để năng lực của chính tinh tại ${primary.name} được triển khai khá liền mạch, nhất là khi các cung liên hệ cùng được vận hạn kích hoạt theo chiều thuận.`;
    if (challengeScore >= supportScore + 5)
        third = `Trong toàn bộ cụm cung, sát tinh và yếu tố gây sức ép nổi trội hơn. Quá trình phát triển của ${title.toLowerCase()} vì thế thường đi qua nhiều lần điều chỉnh, thay đổi nhịp hoặc xử lý mâu thuẫn trước khi hình thành kết quả ổn định.`;
    return [first, second, third];
}

function periodParagraphs(palaces, palace, label, contextIds, movingConfig) {
    const paragraphs = [
        `${label} nhập cung ${palace.name} tại ${palace.branch}, đưa ${PALACE_THEMES[palace.name]} lên thành trục chính của giai đoạn. Từ vị trí này, các sự kiện của thời kỳ thường biểu hiện qua ${PALACE_MANIFESTATIONS[palace.name]}, còn mức độ thuận nghịch được quyết định bởi chính tinh, phụ tinh và các lớp vận lớn hơn.`,
        periodNatalContext(palace, label),
        compactModifierSynthesis(palace, label.toLowerCase()),
        (0, patterns_1.buildActivationParagraph)(palaces, [palace.id, ...contextIds], `Khi đặt ${label.toLowerCase()} trong toàn bộ chuỗi thời gian`)
    ];
    if (movingConfig)
        paragraphs.push(movingParagraph(palace, movingConfig.label, movingConfig.arrayName, movingConfig.context));
    return paragraphs;
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

    items.push(makeItem("overview-structure", "Tổng quan", "Cấu trúc tổng thể của lá số", [
        `Mệnh an tại ${life.branch}, Thân cư ${body.name} tại ${body.branch}. Bản mệnh thuộc ${birthElement}, lá số thuộc ${bureauLabel}; quan hệ Mệnh - Cục là ${bureauRelation.description}. Cung Mệnh mô tả nền khí chất và cách tiếp nhận hoàn cảnh, còn cung Thân cho biết lĩnh vực cá nhân dồn nhiều năng lượng hơn khi bước vào giai đoạn trưởng thành. Vì Thân cư ${body.name}, trọng tâm biểu hiện lâu dài thường gắn với ${PALACE_THEMES[body.name]}.`,
        compactPalaceSynthesis(life, "bức tranh tổng quan về khí chất và cách tự định vị"),
        compactModifierSynthesis(life, "cấu trúc tổng quan của cung Mệnh"),
        body.id === life.id
            ? `Mệnh và Thân đồng cung tại ${life.branch}, vì vậy động lực bên trong và cách hành động khi trưởng thành cùng đi qua một hệ sao. Cấu trúc này làm các đặc tính của ${majorDisplay(life)} xuất hiện nhất quán hơn giữa cảm nhận, lựa chọn thực tế và trách nhiệm lâu dài.`
            : compactPalaceSynthesis(body, `bức tranh trưởng thành qua cung ${body.name}`),
        body.id === life.id
            ? `Khái quát lại, Mệnh và Thân cùng đặt tại ${life.branch} nên điều cá nhân cảm nhận, cách lựa chọn và lĩnh vực phải chịu trách nhiệm có xu hướng hội tụ trên một trục. Các vận hạn đi qua cung này vì thế thường tác động đồng thời lên cả nội tâm lẫn hành động thực tế.`
            : `Khái quát lại, Mệnh tại ${life.branch} tạo động lực khởi đầu, còn Thân cư ${body.name} tại ${body.branch} quyết định nơi động lực ấy được chuyển thành hành động lâu dài. Toàn bộ lá số vì vậy cần được đọc theo hướng từ khí chất bên trong sang ${PALACE_THEMES[body.name]}, thay vì xem hai cung như hai phần tách biệt.`
    ]));

    const configurationParagraphs = (0, patterns_1.buildConfigurationParagraphs)(palaces, life.id);
    if (configurationParagraphs.length) {
        items.push(makeItem("overview-configurations", "Tổng quan", "Cách cục và cấu trúc hội chiếu", [
            `Cung Mệnh tại ${life.branch} cần được đọc đồng thời với hai cung tam hợp và cung xung chiếu. Khi một nhóm chính tinh có quan hệ chức năng cùng xuất hiện trong bốn cung này, trọng tâm của lá số không còn nằm ở từng sao riêng lẻ mà chuyển thành cách các cung phân công vai trò, hỗ trợ hoặc kiềm chế lẫn nhau.`,
            ...configurationParagraphs
        ]));
    }
    const adjacentParagraphs = (0, patterns_1.buildAdjacentParagraphs)(palaces, life.id);
    if (adjacentParagraphs.length) {
        items.push(makeItem("overview-adjacent", "Tổng quan", "Giáp cung và ảnh hưởng từ hai phía", [
            `Hai cung đứng ngay trước và ngay sau cung Mệnh tạo lớp ảnh hưởng gián tiếp nhưng liên tục. Khác với sao tọa thủ, sao giáp cung không thay thế trục chính của Mệnh; chúng tạo điều kiện bao quanh, làm tăng lực hỗ trợ hoặc sức ép tùy theo tính chất của cặp sao và thời điểm được vận hạn kích hoạt.`,
            ...adjacentParagraphs
        ]));
    }

    items.push(makeItem("overview-period", "Tổng quan", `Trục vận hạn năm ${viewYearCanChi}`, [
        `Ở tuổi mụ ${nominalAge}, ${activeDecade ? `đại vận nằm tại cung ${activeDecade.name} ở ${activeDecade.branch}` : "lá số chưa bước vào đại vận mười năm đầu tiên"}. Lưu đại hạn ${annualDecade ? `đi vào cung ${annualDecade.name} ở ${annualDecade.branch}` : "chưa xác định"}, tiểu hạn ở cung ${minorFortune.name}, Lưu Thái Tuế ở cung ${yearBranchPalace.name}, lưu nguyệt tháng ${viewMonth} ở cung ${monthlyPalace.name}, lưu nhật ngày ${viewDay} ở cung ${dailyPalace.name} và lưu thời ${viewHourCanChi} ở cung ${hourlyPalace.name}. Chuỗi này đi từ bối cảnh dài hạn đến thời điểm hẹp, nên lớp sau được đọc trong giới hạn của lớp trước.`,
        (0, patterns_1.buildActivationParagraph)(palaces, [activeDecadePalaceId, annualDecadePalaceId, minorFortunePalaceId, yearBranchPalaceId, monthlyPalaceId, dailyPalaceId, hourlyPalaceId], `Vận hạn năm ${viewYear}`),
        `Các cung nổi lên trong năm lần lượt chạm tới ${formatList(unique([activeDecade, annualDecade, minorFortune, yearBranchPalace, monthlyPalace, dailyPalace, hourlyPalace].filter(Boolean).map((palace) => PALACE_THEMES[palace.name])))}. Vì vậy, báo cáo vận hạn cần được hiểu như một hệ thống liên kết giữa nhiều lĩnh vực, thay vì tách từng sao lưu thành kết luận độc lập.`
    ]));

    items.push(makeItem("life-detail", "Mệnh - Thân", `Mối liên hệ giữa Mệnh và Thân`, [
        `Cung Mệnh tại ${life.branch} là điểm khởi phát của cách nhìn nhận và phản ứng, còn cung Thân tại ${body.branch} cho biết nơi phản ứng ấy trở thành lựa chọn có hậu quả lâu dài. Vì Thân cư ${body.name}, quá trình trưởng thành thường đòi hỏi cá nhân đưa khí chất của cung Mệnh vào ${PALACE_THEMES[body.name]}.`,
        compactPalaceSynthesis(life, "cách phản ứng ban đầu của cung Mệnh"),
        compactPalaceSynthesis(body, `cách hành động khi trưởng thành tại cung ${body.name}`),
        lifeBodyInteractionParagraph(life, body)
    ]));
    items.push(makeItem("body-detail", "Mệnh - Thân", `Trục phát triển của cung Thân`, [
        `Cung Thân nằm tại ${body.name} ở ${body.branch}, cho thấy ${PALACE_THEMES[body.name]} là nơi cá nhân phải trực tiếp lựa chọn, chịu trách nhiệm và bộc lộ năng lực rõ hơn theo thời gian. Trục này thường hiện ra qua những hoàn cảnh yêu cầu hành động thực tế, thay vì chỉ phản ánh cảm nhận bên trong.`,
        compactModifierSynthesis(body, `quá trình phát triển của cung Thân tại ${body.name}`),
        `Trong quan hệ với cung Mệnh tại ${life.branch}, cung Thân nhận phần động lực ban đầu từ ${formatList(getStars(life, ["major"]).map((star) => star.name)) || "hệ sao hội chiếu"} và chuyển nó sang cách vận hành của ${formatList(getStars(body, ["major"]).map((star) => star.name)) || "cung vô chính diệu"}. Điều này giải thích vì sao cùng một khí chất có thể tạo ra các lựa chọn khác nhau khi đi vào quan hệ, nghề nghiệp hoặc trách nhiệm cụ thể.`,
        `Tam phương và cung xung chiếu của Thân nối chủ đề ${PALACE_THEMES[body.name]} với ${formatList(relationSet(palaces, body).triadPalaces.map((item) => PALACE_THEMES[item.name]))} và ${PALACE_THEMES[relationSet(palaces, body).opposite.name]}. Trục phát triển của cung Thân vì vậy chịu ảnh hưởng từ cả năng lực cá nhân lẫn môi trường quan hệ xung quanh.`
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
        items.push(makeItem("decade-main", "Đại vận", `Đại vận ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`, periodParagraphs(
            palaces,
            activeDecade,
            `Đại vận ${activeDecade.decadeStart}-${activeDecade.decadeEnd} tuổi`,
            [annualDecadePalaceId, minorFortunePalaceId],
            null
        )));
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
        `Bộ sao lưu năm gồm ${formatList(annualStars.map((item) => item.name))}. Nhóm sao này phân bố trên nhiều cung, tạo nên các điểm nhấn về nguồn lực, quyền chủ động, sự ghi nhận, dịch chuyển và những nơi dễ phát sinh áp lực. Ý nghĩa của sao lưu chỉ có giá trị khi được đặt vào cung mà nó đi tới và so sánh với chính tinh gốc tại cung đó.`,
        `${palaces.filter((palace) => palace.annualStars.length).map((palace) => `${palace.name} tại ${palace.branch} nhận ${formatList(palace.annualStars.map((item) => item.name))}`).join(". ")}. Sự phân bố này cho biết những chủ đề được kích hoạt trong năm, còn mức độ thuận nghịch phụ thuộc nền sao gốc, đại vận và tiểu hạn.`
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
        items.push(makeItem(id, annualTopic, `${title} năm ${viewYear}`, [
            `Phương diện ${title.toLowerCase()} được đọc trước hết từ cung ${primary.name} tại ${primary.branch}, sau đó đối chiếu với ${formatList(related.map((item) => `${item.name} tại ${item.branch}`))}. Cách đọc này giúp phân biệt nền tảng sẵn có của lĩnh vực với phần biến động chỉ xuất hiện trong năm ${viewYear}.`,
            compactPalaceSynthesis(primary, `nền tảng ${title.toLowerCase()} trước khi xét sao lưu năm ${viewYear}`),
            movingParagraph(primary, `năm ${viewYear}`, "annualStars", `${formatList(related.map((item) => item.name))}, đại vận và tiểu hạn`),
            `Trong cụm liên hệ, ${related.map((item) => `${item.name} có ${majorDisplay(item)} và phản ánh ${PALACE_THEMES[item.name]}`).join("; ")}. Vì vậy, diễn biến ${title.toLowerCase()} trong năm chịu tác động đồng thời từ cấu trúc gốc của cung ${primary.name}, cách cá nhân hành động và môi trường thực tế. Mức độ biểu hiện tăng khi cung ${primary.name} trùng hoặc tam hợp với một trong các cung vận hạn chính.`
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
    items.push(makeItem("month-moving-stars", monthTopic, "Nhịp vận động trong tháng", [
        `Bộ sao lưu tháng gồm ${formatList(monthlyStars.map((item) => item.name))}. Các sao này thu hẹp trọng tâm của năm vào một khoảng thời gian ngắn hơn, giúp nhận diện nơi nguồn lực được tăng cường và nơi áp lực dễ xuất hiện rõ.`,
        `${palaces.filter((palace) => palace.monthlyStars.length).map((palace) => `${palace.name} tại ${palace.branch} nhận ${formatList(palace.monthlyStars.map((item) => item.name))}`).join(". ")}. Khi cung lưu nguyệt trùng với tiểu hạn, lưu đại hạn hoặc đại vận, chủ đề của cung đó thường nổi bật hơn trong tháng.`
    ]));

    const dayTopic = `Lưu nhật ngày ${viewDay}`;
    items.push(makeItem("day-synthesis", dayTopic, `Tổng hợp ngày ${viewDay} âm lịch - ${viewDayCanChi}`, periodParagraphs(
        palaces,
        dailyPalace,
        `Lưu nhật ngày ${viewDay} âm lịch`,
        [monthlyPalaceId, minorFortunePalaceId, annualDecadePalaceId],
        { label: `ngày ${viewDay} âm lịch`, arrayName: "dailyStars", context: "lưu nguyệt, tiểu hạn và vận năm" }
    )));
    items.push(makeItem("day-moving-stars", dayTopic, "Nhịp vận động trong ngày", [
        `Bộ sao lưu ngày gồm ${formatList(dailyStars.map((item) => item.name))}. Đây là lớp thời gian ngắn, dùng để xác định chủ đề nào trong tháng có khả năng được kích hoạt rõ hơn vào ngày đang xem.`,
        `${palaces.filter((palace) => palace.dailyStars.length).map((palace) => `${palace.name} tại ${palace.branch} nhận ${formatList(palace.dailyStars.map((item) => item.name))}`).join(". ")}. Các dấu hiệu trong ngày cần được đặt dưới xu hướng của tháng và năm để tránh khuếch đại một biến động ngắn thành kết luận dài hạn.`
    ]));

    const hourTopic = `Lưu thời giờ ${viewHourBranch}`;
    items.push(makeItem("hour-synthesis", hourTopic, `Tổng hợp giờ ${viewHourCanChi}`, periodParagraphs(
        palaces,
        hourlyPalace,
        `Lưu thời giờ ${viewHourCanChi}`,
        [dailyPalaceId, monthlyPalaceId, minorFortunePalaceId],
        { label: `giờ ${viewHourCanChi}`, arrayName: "hourlyStars", context: "lưu nhật, lưu nguyệt và tiểu hạn" }
    )));
    items.push(makeItem("hour-moving-stars", hourTopic, "Nhịp vận động trong giờ", [
        `Bộ sao lưu giờ gồm ${formatList(hourlyStars.map((item) => item.name))}. Lớp này chỉ thu hẹp trọng tâm của ngày vào một khung thời gian cụ thể, phù hợp để quan sát nhịp sự việc hơn là đưa ra kết luận dài hạn.`,
        `${palaces.filter((palace) => palace.hourlyStars.length).map((palace) => `${palace.name} tại ${palace.branch} nhận ${formatList(palace.hourlyStars.map((item) => item.name))}`).join(". ")}. Khi lưu thời trùng với lưu nhật hoặc lưu nguyệt, chủ đề của cung tương ứng có thể biểu hiện tập trung hơn trong khung giờ đã chọn.`
    ]));

    return items;
}
