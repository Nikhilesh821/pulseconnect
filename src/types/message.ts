export interface Message{
	senderId: string;
	content: string;
	messageType: "text" | "image"| "video";
	timeStamp: Date;
}