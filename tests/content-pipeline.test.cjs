const assert = require('node:assert/strict');
const pipeline = require('../src/engine/content-pipeline.js');

function insight(overrides) {
  return pipeline.createAtomicInsight({
    ruleId: 'synthetic-base',
    topic: 'Sự nghiệp',
    polarity: 'neutral',
    strength: 3,
    evidence: [{ palaceId: 5, starIds: ['synthetic'] }],
    claim: 'Con đường nghề nghiệp thiên về khả năng tự chủ',
    explanation: 'Căn cứ tổng hợp đến từ cung Quan Lộc và các cung liên hệ',
    manifestations: ['Trong thực tế, xu hướng này thể hiện qua cách nhận trách nhiệm'],
    conditions: ['môi trường cho phép chủ động xử lý vấn đề'],
    ...overrides
  });
}

const supportive = insight({
  ruleId: 'synthetic-support',
  polarity: 'supportive',
  strength: 5,
  claim: 'Khả năng mở đường và nhận trách nhiệm khá rõ',
  explanation: 'Các yếu tố nâng đỡ cùng củng cố tính chủ động',
  manifestations: ['Cơ hội thường đến qua phần việc cần tự quyết'],
  conditions: ['môi trường có đủ quyền hạn và nguồn lực']
});
const challenging = insight({
  ruleId: 'synthetic-challenge',
  polarity: 'challenging',
  strength: 5,
  claim: 'Độ ổn định giảm khi nhiều thay đổi xuất hiện cùng lúc',
  explanation: 'Các yếu tố gây sức ép làm kế hoạch dễ phải điều chỉnh',
  manifestations: ['Mặt khó nằm ở việc duy trì một hướng đủ lâu'],
  conditions: ['áp lực thời gian và trách nhiệm chồng lên nhau']
});
const mixed = pipeline.synthesizeInsights([supportive, challenging], { maxParagraphs: 2 });
assert.equal(mixed.length, 1);
assert.match(mixed[0], /Khả năng mở đường/);
assert.match(mixed[0], /độ ổn định giảm/iu);
assert.match(mixed[0], /Mặt khó nằm/);
assert.match(mixed[0], /áp lực thời gian/);
assert.doesNotMatch(mixed[0], /ruleId|evidence|confidence|relationType/i);

const nearDuplicate = insight({
  ruleId: 'synthetic-near-duplicate',
  strength: 1,
  claim: 'Con đường nghề nghiệp có xu hướng thiên về khả năng tự chủ'
});
assert.equal(pipeline.synthesizeInsights([insight({ ruleId: 'synthetic-original' }), nearDuplicate]).length, 1);

const confidenceOrdered = pipeline.synthesizeInsights([
  insight({ ruleId: 'synthetic-low', confidence: 'low', strength: 10, claim: 'Tín hiệu phụ không nên mở đầu phần luận giải' }),
  insight({ ruleId: 'synthetic-high', confidence: 'high', strength: 2, claim: 'Xu hướng chính có căn cứ liên cung rõ hơn' })
], { maxParagraphs: 2 });
assert.match(confidenceOrdered[0], /^Xu hướng chính/);

const safe = pipeline.synthesizeInsights([insight({
  ruleId: 'synthetic-safety',
  claim: 'Người xem chắc chắn sẽ có kết quả cố định'
})])[0];
assert.doesNotMatch(safe, /chắc chắn sẽ/iu);
assert.match(safe, /có xu hướng/iu);

const finalized = pipeline.finalizeInterpretations([
  { id: 'a', topic: 'Tổng quan', title: 'Giai đoạn đầu', paragraphs: ['14-23 tuổi là giai đoạn hình thành nền tảng và điều chỉnh cách phản ứng trước môi trường.'] },
  { id: 'b', topic: 'Tổng quan', title: 'Giai đoạn sau', paragraphs: ['24-33 tuổi là giai đoạn hình thành nền tảng và điều chỉnh cách phản ứng trước môi trường.'] }
]);
assert.equal(finalized.length, 2);
assert.equal(finalized[0].paragraphs.length, 1);
assert.equal(finalized[1].paragraphs.length, 1);
assert.notEqual(finalized[0].paragraphs[0], finalized[1].paragraphs[0]);

console.log('Content pipeline tests passed: atomic insights, conflict synthesis, repetition and safety checks');
