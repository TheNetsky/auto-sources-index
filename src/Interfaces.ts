export interface Repos {
    repos: Repo[];
}

export interface Repo {
    url: string;
    name: string;
    version: string;
    devId: string;
}

export interface RepoData {
    buildTime: Date;
    sources: Source[];
}

export interface Source {
    id: string;
    name: string;
    author: string;
    desc: string;
    website: string;
    contentRating: string;
    version: string;
    icon: string;
    tags: Tag[];
    websiteBaseURL: string;
}

export interface Tag {
    text: string;
    type: string;
}


export interface RepoInfo {
    author: {
        name: string;
        url: string;
    };
    repoURL: string;
    baseURL: string;
    name: string;
    lastUpdated: Date;
    version: string;
    sources: Source[];
    devId: string;



}