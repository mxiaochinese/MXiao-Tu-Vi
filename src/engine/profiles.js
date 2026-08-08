"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CALCULATION_PROFILE_LIST = exports.CALCULATION_PROFILES = void 0;
exports.getCalculationProfile = getCalculationProfile;
exports.CALCULATION_PROFILES = {
    VN_TAN_BIEN_1956: {
        id: "VN_TAN_BIEN_1956",
        name: "Tân Biên - giờ Tý từ 23:00",
        ziHourMode: "zi23",
        lifeCycleMode: "same-start-reverse",
        leapFortuneMode: "split-half-next"
    },
    VN_AO_BI_1972: {
        id: "VN_AO_BI_1972",
        name: "Áo Bí - giờ Tý từ 00:00",
        ziHourMode: "zi00",
        lifeCycleMode: "yin-alternate-start",
        leapFortuneMode: "split-half-next"
    }
};
exports.CALCULATION_PROFILE_LIST = Object.values(exports.CALCULATION_PROFILES);
function getCalculationProfile(id = "VN_TAN_BIEN_1956") {
    const profile = exports.CALCULATION_PROFILES[id];
    if (!profile) throw new Error("Không tìm thấy phương pháp lập lá số.");
    return profile;
}
