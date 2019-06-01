interface Project {
  id: number
  namespace: string
  name: string
  path_with_namespace: string
  default_branch: string
  description: string
  web_url: string
  git_ssh_url: string
  git_http_url: string
  avatar_url: string | null
  visibility_level: number
  homepage: string
  url: string
}

interface Commit {
  id: string
  message: string
  timestamp: string
  url: string
  author: {
    name: string
    email: string
  }
  added: string[]
  modified: string[]
  removed: string[]
}

export interface BaseHookData {
  object_kind: string
  ref: string
  before: string
  after: string
  checkout_sha: string

  user_id: number
  user_name: string
  user_username: string
  user_email: string
  user_avatar: string

  project_id: number
  project: Project

  commits: Commit[]
  total_commits_count: number
}

// export interface PushHookData extends BaseHookData {}

// export interface TagPushHookData extends BaseHookData {}
