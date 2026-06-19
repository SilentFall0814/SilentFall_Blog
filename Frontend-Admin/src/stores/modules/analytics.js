import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getViewRecordPage, deleteViewRecords } from '@/api/viewRecord'

export const useAnalyticsStore = defineStore('analytics', () => {
  /* ---- View Records ---- */
  const viewList = ref([])
  const viewTotal = ref(0)
  const viewLoading = ref(false)

  /** @param {{ page: number, pageSize: number }} query */
  const fetchViewList = async (query) => {
    viewLoading.value = true
    try {
      const res = await getViewRecordPage(query)
      viewList.value = res.data?.records ?? []
      viewTotal.value = res.data?.total ?? 0
    } finally {
      viewLoading.value = false
    }
  }

  /** @param {number[]} ids */
  const removeViewRecords = async (ids) => await deleteViewRecords(ids)

  return {
    viewList,
    viewTotal,
    viewLoading,
    fetchViewList,
    removeViewRecords
  }
})
