import { Dimensions, StyleSheet} from "react-native";

export const style = StyleSheet.create({
    container:{
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        padding:10
    },
    boxTop:{
        height:Dimensions.get('window').height/3,
        width:'100%',
        //backgroundColor:'red',
        alignItems:'center',
        justifyContent:'center'
    },
    boxMid:{
        height:Dimensions.get('window').height/4,
        width:'100%',
        //backgroundColor:'green',
        paddingHorizontal:40
    },
    boxBottom:{
        height:Dimensions.get('window').height/3,
        width:'100%',
        //backgroundColor:'blue',
        paddingHorizontal:40,
        alignItems:'center'
        //justifyContent:'center'
    },
    logo:{
        width:80,
        height:80
    },
    text:{
        fontWeight:'bold',
        marginTop:40
    },
    titleInput:{
        marginTop:20,
        marginLeft:5,
    },
    Box:{
        width:'100%',
        height:40,
        borderWidth:1,
        borderRadius:30,
        marginTop:10,
        paddingLeft:5,
        //backgroundColor:'lightgray',
        //borderColor:'gray'
    },
    button:{
        width:'100%',
        height:50,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'lightgray',
        borderRadius:30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 7
    },
    buttonText:{
        fontWeight:'bold',
        //color:'white'
    },
    textBottom:{
        fontSize:16
    }
});