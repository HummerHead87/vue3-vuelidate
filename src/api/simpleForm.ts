const sleep = (delay: number) => new Promise(resolve => setTimeout(resolve, delay))

export async function checkNicknameForUniqRequest(nickname: string) {
  console.log('checking', nickname)
  await sleep(300)

  return nickname !== 'nickname'
}

export class ApiError extends Error {
  params!: Record<string, string[]>
  status!: string

  constructor(status: string, params: ApiError['params']) {
    super(`api error ${status}`)

    this.status = status
    this.params = params
  }
}


export async function submitFormRequest(params: any) {
  await sleep(300)

  if (params.email === 'email@example.com') {
    throw new ApiError('422', {
      email: ['Такой email уже занят']
    })
  }

  return 'ok'
}
