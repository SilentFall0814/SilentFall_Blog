import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  pagePhoto,
  getPhoto,
  batchUploadPhoto,
  updatePhoto,
  deletePhoto
} from '@/api/photo'

export const usePhotoStore = defineStore('photo', () => {
  const photos = ref([])
  const total = ref(0)
  const loading = ref(false)

  /** 分页查询照片 */
  const fetchPage = async (params) => {
    loading.value = true
    try {
      const res = await pagePhoto(params)
      photos.value = res.data.records ?? []
      total.value = res.data.total ?? 0
    } finally {
      loading.value = false
    }
  }

  /** 查询单张照片 */
  const fetchOne = async (id) => {
    const res = await getPhoto(id)
    return res.data
  }

  /** 批量上传照片 */
  const batchUpload = (formData) => batchUploadPhoto(formData)

  /** 更新照片 */
  const update = (data) => updatePhoto(data)

  /** 批量删除照片 */
  const remove = (ids) => deletePhoto(ids)

  return {
    photos,
    total,
    loading,
    fetchPage,
    fetchOne,
    batchUpload,
    update,
    remove
  }
})
