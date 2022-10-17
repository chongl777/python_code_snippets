export interface Serializable<T> {
    deserialize(input: any, securityService: any): T;
    deserialize(input: any): T;
}

export interface SerializableAsync<T> {
    deserialize(input: any, securityService: any): Promise<T>;
    deserialize(input: any): Promise<T>;

}
