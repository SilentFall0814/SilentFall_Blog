import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  pageAlbum,
  getAlbum,
  addAlbum,
  updateAlbum,
  deleteAlbum,
  uploadImageWithThumb
} from '@/api/album'

export const useAlbumStore = defineStore('album', () => {
  const albums = ref([])
  const total = ref(0)
  const loading = ref(false)

  /** 分页查询相册 */
  const fetchPage = async (params) => {
    loading.value = true
    try {
      const res = await pageAlbum(params)
      albums.value = res.data.records ?? []
      total.value = res.data.total ?? 0
    } finally {
      loading.value = false
    }
  }

  /** 查询单个相册 */
  const fetchOne = async (id) => {
    const res = await getAlbum(id)
    return res.data
  }

  /** 创建相册 */
  const create = (data) => addAlbum(data)

  /** 更新相册 */
  const update = (data) => updateAlbum(data)

  /** 批量删除相册 */
  const remove = (ids) => deleteAlbum(ids)

  /** 图片上传（含缩略图） */
  const uploadImage = (formData) => uploadImageWithThumb(formData)

  return {
    albums,
    total,
    loading,
    fetchPage,
    fetchOne,
    create,
    update,
    remove,
    uploadImage
  }
})
