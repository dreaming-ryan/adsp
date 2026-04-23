/**
 * adsp_stats.js — adsp_quiz.html의 QUESTIONS 배열을 파싱하여
 * 회차·과목별 통계와 문제 원본 배열을 콜백으로 반환합니다.
 *
 * ADsP의 분류 체계:
 *   - round: 44, 45, 46, 47, 48 (회차)
 *   - subject: 1, 2, 3 (1과목=데이터 이해, 2과목=분석 기획, 3과목=데이터 분석)
 */
(function () {
  'use strict';

  // 과목 번호 → 과목명 매핑 (ADsP 공식)
  var SUBJECT_NAMES = {
    1: '데이터 이해',
    2: '데이터분석 기획',
    3: '데이터 분석'
  };

  function loadStats(callback) {
    fetch('adsp_quiz.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        // adsp_quiz.html의 script 태그 안에 있는 const QUESTIONS = [ ... ]; 배열을 찾기
        // 배열 내부에는 따옴표, 콤마, 중괄호가 많이 있으므로 탐욕적(non-greedy) 매칭에 주의
        // "\n];" 또는 "];\n"으로 끝나는 패턴 매칭
        var arrMatch = html.match(/const\s+QUESTIONS\s*=\s*(\[[\s\S]*?\n\s*\])\s*;/);
        if (!arrMatch) {
          console.error('adsp_stats.js: QUESTIONS 배열 추출 실패');
          return;
        }

        // 새 Function으로 배열 리터럴을 실제 JS 객체로 변환
        var questions;
        try {
          questions = (new Function('return ' + arrMatch[1]))();
        } catch (e) {
          console.error('adsp_stats.js: QUESTIONS 파싱 오류', e);
          return;
        }

        var totalQ = questions.length;
        var roundMap = {};     // { 44: 50, 45: 50, ... }  회차별 문항 수
        var subjectMap = {};   // { 1: xx, 2: xx, 3: xx }  과목별 문항 수
        var roundSet = new Set();
        var subjectSet = new Set();

        questions.forEach(function (q) {
          roundSet.add(q.round);
          subjectSet.add(q.subject);
          roundMap[q.round] = (roundMap[q.round] || 0) + 1;
          subjectMap[q.subject] = (subjectMap[q.subject] || 0) + 1;
        });

        // 회차 정렬 (오름차순): [44, 45, 46, 47, 48]
        var rounds = Array.from(roundSet).sort(function (a, b) { return a - b; });
        var subjects = Array.from(subjectSet).sort(function (a, b) { return a - b; });
        var totalRounds = rounds.length;

        callback({
          totalQ: totalQ,
          totalRounds: totalRounds,
          rounds: rounds,
          subjects: subjects,
          roundMap: roundMap,
          subjectMap: subjectMap,
          subjectNames: SUBJECT_NAMES,
          questions: questions
        });
      })
      .catch(function (err) {
        console.error('adsp_stats.js fetch 오류:', err);
      });
  }

  window.AdspStats = {
    load: loadStats,
    SUBJECT_NAMES: SUBJECT_NAMES
  };
})();
