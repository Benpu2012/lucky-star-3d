import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  zh: {
    translation: {
      title: '星语瓶',
      subtitle: '把愿望折进星星里',
      placeholder: '输入你的愿望...',
      submit: '放入瓶中',
      expand: '展开折纸',
      clear: '清空',
      clearConfirm: '确定要清空所有星星吗？此操作不可撤销。',
      paperTitle: '折纸 · 愿望清单',
      paperSubtitle: '这些都是你折进星星里的话',
      dailyLimit: '每日最多可以折 8 颗星星',
      todayCount: '今天已折星星：{{count}}/{{total}}',
      totalCount: '至今一共折了 {{count}} 颗许愿星星',
      noWishes: '还没有任何愿望，先写一条试试吧。',
      starModalTitle: '一颗幸运星',
      delete: '删除',
      loading: '正在点亮星空...',
    }
  },
  en: {
    translation: {
      title: 'Star Jar',
      subtitle: 'Fold your wishes into stars',
      placeholder: 'Type your wish...',
      submit: 'Put in Jar',
      expand: 'Expand Paper',
      clear: 'Clear',
      clearConfirm: 'Are you sure you want to clear all stars? This cannot be undone.',
      paperTitle: 'Origami · Wish List',
      paperSubtitle: 'Wishes you folded into stars',
      dailyLimit: 'Max 8 stars per day',
      todayCount: 'Today: {{count}}/{{total}}',
      totalCount: 'Total stars folded: {{count}}',
      noWishes: 'No wishes yet. Try writing one!',
      starModalTitle: 'A Lucky Star',
      delete: 'Delete',
      loading: 'Lighting up the sky...',
    }
  },
  ja: {
    translation: {
      title: '星の瓶',
      subtitle: '願いを星に折り込む',
      placeholder: '願い事を入力...',
      submit: '瓶に入れる',
      expand: '折り紙を開く',
      clear: 'クリア',
      clearConfirm: 'すべての星を削除してもよろしいですか？この操作は取り消せません。',
      paperTitle: '折り紙 · 願い事リスト',
      paperSubtitle: 'あなたが星に込めた願い',
      dailyLimit: '1日最大8個まで',
      todayCount: '今日：{{count}}/{{total}}',
      totalCount: 'これまでに折った星：{{count}}個',
      noWishes: 'まだ願い事がありません。書いてみましょう！',
      starModalTitle: 'ラッキースター',
      delete: '削除',
      loading: '星空を点灯中...',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
