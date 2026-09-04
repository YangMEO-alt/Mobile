import React, {useState} from "react";
import {Text, View, Image, TextInput, TouchableOpacity} from 'react-native';
import { style } from "./style";
import Logo from '../../assets/nopicture.png'

export default function Login(){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function handleLogin(){
        console.log('Email:', email);
        console.log('Senha:', password);
    }

    return(
        <View style={style.container}>
            <View style={style.boxTop}>
                <Image source={Logo} 
                style={style.logo}
                resizeMode="contain"
                />
                <Text style={style.text}>Bem vindo de volta!</Text>
            </View>
            <View style={style.boxMid}>
                <Text style={style.titleInput}>Digite seu e-mail:</Text>
                <View style={style.Box}>
                <TextInput placeholder="E-mail" />
                    <TextInput 
                    value={email} onChangeText={setEmail}
                    />
                </View>
                <Text style={style.titleInput}>Digite sua senha:</Text>
                <View style={style.Box}>
                <TextInput placeholder="Senha" />
                    <TextInput 
                    value={password} onChangeText={setPassword}
                    />
                </View>
            </View>
            <View style={style.boxBottom}>
                <TouchableOpacity style={style.button}>
                    <Text style={style.buttonText}>Entrar</Text>
                </TouchableOpacity>
            </View>
            <Text style={style.textBottom}>Não possui uma conta? <Text style={{color: 'blue'}}>Crie agora!</Text></Text>
        </View>
    )
}
